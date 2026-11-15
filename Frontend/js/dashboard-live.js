/* =====================================================
   PRINTIFY - DASHBOARD LIVE DATA
   GET /api/dashboard/summary
===================================================== */

document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    /* =================================================
       HELPERS
    ================================================= */

    function escapeHTML(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (character) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[character];
        });
    }

    function peso(value) {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP"
        }).format(Number(value) || 0);
    }

    function setText(id, value) {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value == null ? "0" : value;
        }
    }

    function emptyRow(columns, message) {
        return `
            <tr>
                <td colspan="${columns}">
                    ${escapeHTML(message)}
                </td>
            </tr>
        `;
    }

    function getArray(value) {
        return Array.isArray(value) ? value : [];
    }


    /* =================================================
       LOAD DASHBOARD SUMMARY
    ================================================= */

    function loadSummary() {
        if (window.PrintifySummary) {
            return window.PrintifySummary;
        }

        if (
            !window.PrintifyAPI ||
            typeof window.PrintifyAPI.request !== "function"
        ) {
            return null;
        }

        try {
            const response = window.PrintifyAPI.request(
                "GET",
                "/api/dashboard/summary"
            );

            if (!response || response.status !== 200) {
                console.error("Dashboard summary request failed:", response);
                return null;
            }

            return response.data || null;

        } catch (error) {
            console.error("Unable to load dashboard summary:", error);
            return null;
        }
    }


    /* =================================================
       SUMMARY CARDS
    ================================================= */

    function renderSummaryCards(summary) {
        setText("totalCustomers", summary.totalCustomers);
        setText("totalOrders", summary.totalOrders);
        setText("totalSales", peso(summary.totalSales));
        setText("totalStaff", summary.activeStaff);

        setText("currentlyWorking", summary.currentlyWorking);
        setText("completedStaffWork", summary.completedStaffWork);
    }


    /* =================================================
       LOW STOCK
    ================================================= */

    function renderLowStock(summary) {
        const list = document.getElementById("lowStockList");

        const lowStock = getArray(summary.lowStock);
        const lowStockCount = Number(summary.lowStockCount) || lowStock.length;

        setText(
            "lowStockCount",
            lowStockCount + (lowStockCount === 1 ? " Item" : " Items")
        );

        if (!list) return;

        if (lowStock.length === 0) {
            list.innerHTML = `
                <p class="dashboard-empty-message">
                    All items are above their low-stock level.
                </p>
            `;
            return;
        }

        list.innerHTML = lowStock.map(function (item) {
            const category = String(item.category || "").toLowerCase();

            let icon = "inventory_icon.png";
            let iconClass = "";
            let badgeClass = "warning-badge";
            let label = "Reorder Soon";

            if (category.includes("ink")) {
                icon = "ink_icon.png";
                iconClass = "ink-product";
            } else if (
                category.includes("paper") ||
                category.includes("bond")
            ) {
                icon = "paper_icon.png";
            } else {
                icon = "inventory_icon.png";
            }

            if (item.level === "out") {
                badgeClass = "critical-badge";
                label = "Out of Stock";
            } else if (item.level === "critical") {
                badgeClass = "critical-badge";
                label = "Low Stock";
            } else if (item.level === "low") {
                badgeClass = "warning-badge";
                label = "Reorder Soon";
            }

            return `
                <div class="low-stock-item">

                    <div class="product-icon ${iconClass}">
                        <img src="image/${icon}" alt="">
                    </div>

                    <div class="product-information">
                        <strong>${escapeHTML(item.name)}</strong>
                        <span>${escapeHTML(item.category)}</span>
                    </div>

                    <div class="stock-information">
                        <strong>
                            ${escapeHTML(item.quantity)}
                            ${escapeHTML(item.unit || "")}
                        </strong>

                        <span class="stock-badge ${badgeClass}">
                            ${label}
                        </span>
                    </div>

                </div>
            `;
        }).join("");
    }


    /* =================================================
       RECENT TRANSACTIONS
    ================================================= */

    function renderRecentOrders(summary) {
        const ordersBody = document.getElementById("recentOrdersBody");

        if (!ordersBody) return;

        const orders = getArray(summary.recentOrders);

        if (orders.length === 0) {
            ordersBody.innerHTML = emptyRow(6, "No orders yet.");
            return;
        }

        ordersBody.innerHTML = orders.map(function (order) {
            return `
                <tr>
                    <td>${escapeHTML(order.id)}</td>
                    <td>${escapeHTML(order.customer)}</td>
                    <td>${escapeHTML(order.service)}</td>
                    <td>${peso(order.total)}</td>
                    <td>${escapeHTML(order.status)}</td>
                    <td>${escapeHTML(order.paymentStatus)}</td>
                </tr>
            `;
        }).join("");
    }


    /* =================================================
       RECENT SYSTEM ACTIVITY
    ================================================= */

    function renderRecentActivity(summary) {
        const activityBody = document.getElementById("staffRecordsBody");

        if (!activityBody) return;

        const activities = getArray(summary.recentActivity);

        if (activities.length === 0) {
            activityBody.innerHTML = emptyRow(5, "No activity recorded yet.");
            return;
        }

        activityBody.innerHTML = activities.map(function (activity) {
            const date = activity.createdAt
                ? new Date(activity.createdAt)
                : null;

            const formattedDate = date && !isNaN(date.getTime())
                ? date.toLocaleString("en-PH")
                : "—";

            return `
                <tr>
                    <td>${escapeHTML(activity.username)}</td>
                    <td>${escapeHTML(activity.role)}</td>
                    <td>${escapeHTML(activity.action)}</td>
                    <td>${escapeHTML(activity.details)}</td>
                    <td>${escapeHTML(formattedDate)}</td>
                </tr>
            `;
        }).join("");
    }


    /* =================================================
       INITIALIZE DASHBOARD
    ================================================= */

    function initializeDashboard() {
        const summary = loadSummary();

        if (!summary) {
            setText("totalCustomers", "—");
            setText("totalOrders", "—");
            setText("totalSales", "—");
            setText("totalStaff", "—");
            setText("currentlyWorking", "—");
            setText("completedStaffWork", "—");

            const lowStockList = document.getElementById("lowStockList");
            const ordersBody = document.getElementById("recentOrdersBody");
            const activityBody = document.getElementById("staffRecordsBody");

            if (lowStockList) {
                lowStockList.innerHTML = `
                    <p class="dashboard-empty-message">
                        Unable to load inventory information.
                    </p>
                `;
            }

            if (ordersBody) {
                ordersBody.innerHTML = emptyRow(
                    6,
                    "Unable to load recent transactions."
                );
            }

            if (activityBody) {
                activityBody.innerHTML = emptyRow(
                    5,
                    "Unable to load recent system activity."
                );
            }

            return;
        }

        window.PrintifySummary = summary;

        renderSummaryCards(summary);
        renderLowStock(summary);
        renderRecentOrders(summary);
        renderRecentActivity(summary);

        window.dispatchEvent(
            new CustomEvent("printify:summary-updated")
        );
    }

    initializeDashboard();

    console.log("Printify live dashboard initialized.");
});