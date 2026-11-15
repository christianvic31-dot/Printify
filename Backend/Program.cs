using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.HttpsPolicy;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Npgsql;
using Printify.Backend.Data;
using Printify.Backend.Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

/* ==========================================
   1. DATABASE (PostgreSQL)
========================================== */

var configuredConnectionString = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(configuredConnectionString))
{
    throw new InvalidOperationException(
        "Set ConnectionStrings:Default using User Secrets locally or an environment variable in production.");
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(ToNpgsqlConnectionString(configuredConnectionString)));

if (!builder.Environment.IsDevelopment())
{
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
        options.ForwardLimit = 1;
        options.KnownNetworks.Clear();
        options.KnownProxies.Clear();
    });

    builder.Services.Configure<HttpsRedirectionOptions>(options =>
    {
        options.HttpsPort = 443;
    });
}

/* ==========================================
   2. CONTROLLERS + JSON
========================================== */

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.NumberHandling = JsonNumberHandling.AllowReadingFromString;
    options.JsonSerializerOptions.Converters.Add(new LenientStringConverter());
    options.JsonSerializerOptions.Converters.Add(new LenientDecimalConverter());
});

/* ==========================================
   3. LOGIN (cookie session)
========================================== */

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "printify_session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.SlidingExpiration = false;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

        // Never trust the role stored in the cookie: re-check the user in the database on every
        // request. Deleted, deactivated or re-roled users are signed out immediately.
        options.Events.OnValidatePrincipal = async context =>
        {
            var cookieRole = context.Principal?.FindFirstValue(ClaimTypes.Role);

            if (!Guid.TryParse(context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                return;
            }

            var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
            var current = await db.Users.AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new { u.Role, u.Status })
                .FirstOrDefaultAsync();

            if (current == null || current.Role != cookieRole || current.Status == "Inactive")
            {
                context.RejectPrincipal();
                await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            }
        };

        // Para API ito: 401 / 403 ang isasagot imbes na mag-redirect sa login page.
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };

        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

/* ==========================================
   4. GUMAWA NG DATABASE AT MGA TABLE (kung wala pa)
========================================== */

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.EnsureCreated();
        DbBootstrap.Run(db);
        app.Logger.LogInformation("PostgreSQL connected. Database is ready.");
    }
    catch (Exception ex)
    {
        app.Logger.LogCritical("Hindi makakonekta sa PostgreSQL: {Message}", ex.Message);
        app.Logger.LogCritical("Set ConnectionStrings:Default using User Secrets locally or a production environment variable, and verify PostgreSQL is available.");
        return;
    }
}

/* ==========================================
   5. SERVE ANG FRONTEND
========================================== */

var frontendPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "Frontend"));

if (!Directory.Exists(frontendPath))
{
    app.Logger.LogCritical("Hindi makita ang Frontend folder: {Path}", frontendPath);
    return;
}

var frontendFiles = new PhysicalFileProvider(frontendPath);

if (!app.Environment.IsDevelopment())
{
    app.UseForwardedHeaders();
}

// Centralized error handling: log the details, send the browser a safe JSON message.
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    var feature = context.Features.Get<IExceptionHandlerFeature>();
    app.Logger.LogError(feature?.Error, "Unhandled error on {Path}", context.Request.Path);
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new { message = "Something went wrong on the server. Please try again." });
}));

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();

app.Use(async (context, next) =>
{
    context.Response.Headers["Referrer-Policy"] = "same-origin";
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.Use(async (context, next) =>
    {
        if (false && string.Equals(context.Request.Path.Value, "/register.html", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        await next();
    });
}

var defaultFiles = new DefaultFilesOptions { FileProvider = frontendFiles };
defaultFiles.DefaultFileNames.Clear();
defaultFiles.DefaultFileNames.Add("login.html");
app.UseDefaultFiles(defaultFiles);

app.UseStaticFiles(new StaticFileOptions { FileProvider = frontendFiles });

/* ==========================================
   6. API
========================================== */

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Logger.LogInformation("Printify is running. Open {Url}", builder.Configuration["Urls"]);

app.Run();

static string ToNpgsqlConnectionString(string connectionString)
{
    if (!Uri.TryCreate(connectionString, UriKind.Absolute, out var databaseUri) ||
        (databaseUri.Scheme != "postgres" && databaseUri.Scheme != "postgresql"))
    {
        return connectionString;
    }

    var credentials = databaseUri.UserInfo.Split(':', 2);
    var databaseName = Uri.UnescapeDataString(databaseUri.AbsolutePath.Trim('/'));
    if (credentials.Length != 2 || string.IsNullOrWhiteSpace(databaseName))
    {
        throw new InvalidOperationException("The PostgreSQL URL must include a username, password, and database name.");
    }

    var npgsqlConnectionString = new NpgsqlConnectionStringBuilder
    {
        Host = databaseUri.Host,
        Port = databaseUri.Port > 0 ? databaseUri.Port : 5432,
        Database = databaseName,
        Username = Uri.UnescapeDataString(credentials[0]),
        Password = Uri.UnescapeDataString(credentials[1]),
        SslMode = SslMode.Require
    };

    return npgsqlConnectionString.ConnectionString;
}
