/* ==========================================
   PRINTIFY AUTH GUARD
   - Hinaharang ang page kung hindi naka-login o mali ang role
   - Admin pages: <script src="js/auth-guard.js" data-role="Admin"></script>
   - Staff pages: <script src="js/auth-guard.js" data-role="Staff"></script>
   - Kinukuha sa server ang orders at staff bago mag-load ang page
     (synchronous ito para nandiyan na ang data pag nag-start ang page script).
========================================== */

(function () {

    "use strict";

    var script = document.currentScript;
    var requiredRole = script ? script.getAttribute("data-role") : "";

    var ORDERS_KEY = "printifyOrders";            // Admin orders (mirror ng server)
    var STAFF_KEY = "printifyStaff";              // Staff list (mirror ng server)
    var STAFF_ORDERS_KEY = "printify-staff-orders-demo"; // Orders ng naka-login na Staff

    // Itago ang page hanggang ma-verify ang login
    document.documentElement.style.visibility = "hidden";

    function request(method, url, body) {

        var xhr = new XMLHttpRequest();

        try {

            xhr.open(method, url, false);
            xhr.withCredentials = true;

            if (body !== undefined) {
                xhr.setRequestHeader("Content-Type", "application/json");
            }

            xhr.send(body === undefined ? null : JSON.stringify(body));

        } catch (error) {
            return { status: 0, data: null };
        }

        var data = null;

        try {
            data = JSON.parse(xhr.responseText);
        } catch (error) {
            data = null;
        }

        return { status: xhr.status, data: data };

    }

    function homeFor(role) {
        return role === "Admin" ? "dashboard.html" : "staff-dashboard.html";
    }

    function clearMirrors() {

        [ORDERS_KEY, STAFF_KEY, STAFF_ORDERS_KEY,
            "printify-user-name", "printify-user-email",
            "staffName", "staffEmail"].forEach(function (key) {
            try { localStorage.removeItem(key); } catch (error) { /* ignore */ }
        });

    }

    /* ---------- STATUS NAMES (Admin <-> Staff screen) ---------- */

    function toStaffStatus(status) {
        return status === "In Progress" ? "Processing" : status;
    }

    function toServerStatus(status) {
        return status === "Processing" ? "In Progress" : status;
    }

    /* ---------- 1. CHECK LOGIN ---------- */

    var me = request("GET", "/api/auth/me");

    if (me.status !== 200 || !me.data) {
        clearMirrors();
        window.location.replace("login.html");
        return;
    }

    var user = me.data;

    if (requiredRole && user.role !== requiredRole) {
        window.location.replace(homeFor(user.role));
        return;
    }

    /* ---------- 2. PUBLIC API PARA SA MGA PAGE SCRIPT ---------- */

    var ordersSnapshot = {};

    function snapshotOf(order) {
        return JSON.stringify([
            order.customerName, order.customerContact, order.printingService,
            Number(order.quantity), Number(order.unitPrice), Number(order.amountPaid),
            order.orderDate, order.dueDate, order.orderStatus, order.paymentStatus,
            order.notes || "", order.assignedStaffId || null
        ]);
    }

    function orderPayload(order) {
        return {
            id: order.id,
            customerName: order.customerName,
            customerContact: order.customerContact || "",
            printingService: order.printingService,
            quantity: Number(order.quantity),
            unitPrice: Number(order.unitPrice),
            amountPaid: Number(order.amountPaid) || 0,
            orderDate: order.orderDate || "",
            dueDate: order.dueDate || "",
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            notes: order.notes || "",
            assignedStaffId: order.assignedStaffId || null
        };
    }

    function loadAdminOrders() {

        var result = request("GET", "/api/orders");

        if (result.status !== 200 || !result.data) return null;

        var items = result.data.items || [];

        ordersSnapshot = {};

        items.forEach(function (order) {
            ordersSnapshot[order.id] = snapshotOf(order);
        });

        try {
            localStorage.setItem(ORDERS_KEY, JSON.stringify(items));
        } catch (error) { /* ignore */ }

        return items;

    }

    function loadStaffList() {

        var result = request("GET", "/api/staff");

        if (result.status !== 200 || !result.data) return null;

        var items = result.data.items || [];

        try {
            localStorage.setItem(STAFF_KEY, JSON.stringify(items));
        } catch (error) { /* ignore */ }

        return items;

    }

    function loadMyOrders() {

        var result = request("GET", "/api/orders/mine");

        if (result.status !== 200 || !result.data) return null;

        var items = (result.data.items || []).map(function (order) {
            return {
                id: order.id,
                customer: order.customerName,
                contact: order.customerContact,
                product: order.printingService,
                quantity: order.quantity,
                date: order.orderDate,
                dueDate: order.dueDate,
                status: toStaffStatus(order.orderStatus),
                payment: order.paymentStatus,
                notes: order.notes,
                updatedAt: order.updatedAt
            };
        });

        try {
            localStorage.setItem(STAFF_ORDERS_KEY, JSON.stringify(items));
        } catch (error) { /* ignore */ }

        return items;

    }

    var inventorySnapshot = {};

    function inventorySnap(p) {
        return JSON.stringify([p.name, p.category || "", Number(p.quantity), p.unit || "", Number(p.price), Number(p.threshold)]);
    }

    function inventoryPayload(p) {
        return {
            id: p.id,
            name: p.name,
            category: p.category || "",
            quantity: Number(p.quantity) || 0,
            unit: p.unit || "",
            price: Number(p.price) || 0,
            threshold: Number(p.threshold) || 0
        };
    }

    function loadInventory() {

        var result = request("GET", "/api/inventory");

        if (result.status !== 200 || !result.data) return null;

        var items = result.data.items || [];

        inventorySnapshot = {};

        items.forEach(function (item) {
            inventorySnapshot[item.id] = inventorySnap(item);
        });

        return items;

    }

    window.PrintifyAuth = { user: user };

    window.PrintifyAPI = {

        request: request,

        logout: function () {
            request("POST", "/api/auth/logout");
            clearMirrors();
            window.location.replace("login.html");
        },

        // Admin: ihambing ang orders ng page sa nasa server at i-save ang pagkakaiba.
        syncOrders: function (orders) {

            var seen = {};

            for (var i = 0; i < orders.length; i++) {

                var order = orders[i];
                seen[order.id] = true;

                var current = snapshotOf(order);
                var existed = Object.prototype.hasOwnProperty.call(ordersSnapshot, order.id);

                if (existed && ordersSnapshot[order.id] === current) continue;

                var result = existed
                    ? request("PUT", "/api/orders/" + encodeURIComponent(order.id), orderPayload(order))
                    : request("POST", "/api/orders", orderPayload(order));

                if (result.status < 200 || result.status >= 300) {
                    return {
                        ok: false,
                        message: (result.data && result.data.message) || "Unable to save the order to the server."
                    };
                }

                if (result.data && typeof result.data === "object") {
                    Object.assign(order, result.data);
                }

                ordersSnapshot[order.id] = snapshotOf(order);

            }

            for (var id in ordersSnapshot) {

                if (seen[id]) continue;

                var removed = request("DELETE", "/api/orders/" + encodeURIComponent(id));

                if (removed.status !== 404 && (removed.status < 200 || removed.status >= 300)) {
                    return {
                        ok: false,
                        message: (removed.data && removed.data.message) || "Unable to delete the order on the server."
                    };
                }

                delete ordersSnapshot[id];

            }

            return { ok: true };

        },

        // Admin: kunin ulit ang pinakabagong orders mula sa server.
        // Inventory (read: Admin + Staff, write: Admin). Saves only what changed.
        fetchInventory: loadInventory,

        syncInventory: function (products) {

            var seen = {};

            for (var i = 0; i < products.length; i++) {

                var item = products[i];
                seen[item.id] = true;

                var current = inventorySnap(item);
                var existed = Object.prototype.hasOwnProperty.call(inventorySnapshot, item.id);

                if (existed && inventorySnapshot[item.id] === current) continue;

                var result = existed
                    ? request("PUT", "/api/inventory/" + encodeURIComponent(item.id), inventoryPayload(item))
                    : request("POST", "/api/inventory", inventoryPayload(item));

                if (result.status < 200 || result.status >= 300) {
                    return { ok: false, message: (result.data && result.data.message) || "Unable to save the item to the server." };
                }

                inventorySnapshot[item.id] = current;

            }

            for (var id in inventorySnapshot) {

                if (seen[id]) continue;

                var removed = request("DELETE", "/api/inventory/" + encodeURIComponent(id));

                if (removed.status !== 404 && (removed.status < 200 || removed.status >= 300)) {
                    return { ok: false, message: (removed.data && removed.data.message) || "Unable to delete the item on the server." };
                }

                delete inventorySnapshot[id];

            }

            return { ok: true };

        },

        fetchOrders: loadAdminOrders,
        fetchStaff: loadStaffList,

        // Staff: i-save sa server ang status ng order.
        updateOrderStatus: function (id, status) {

            var result = request(
                "PATCH",
                "/api/orders/" + encodeURIComponent(id) + "/status",
                { status: toServerStatus(status) }
            );

            return {
                ok: result.status >= 200 && result.status < 300,
                message: result.data && result.data.message
            };

        },

        fetchMyOrders: loadMyOrders

    };

    /* ---------- 3. I-LOAD ANG DATA NG ROLE ---------- */

    if (user.role === "Admin") {

        loadAdminOrders();
        loadStaffList();

    } else {

        loadMyOrders();

        try {
            localStorage.setItem("printify-user-name", user.fullName || user.username || "Staff Member");
            localStorage.setItem("printify-user-email", user.email || "");
        } catch (error) { /* ignore */ }

    }

    document.documentElement.style.visibility = "";

})();
