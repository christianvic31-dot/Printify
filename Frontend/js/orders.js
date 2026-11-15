
/* =========================================================
   PRINTIFY CALAPAN
   ORDERS PAGE JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    /* =====================================================
       1. STORAGE AND ELEMENTS
    ===================================================== */

    const ORDERS_KEY = "printifyOrders";
    const THEME_KEY = "printify-theme";
    const SIDEBAR_KEY = "printify-sidebar-hidden";

    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const menuToggle = document.getElementById("menuToggle");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const currentDate = document.getElementById("currentDate");
    const currentYear = document.getElementById("currentYear");

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutButton = document.getElementById("logoutButton");
    const notificationButton = document.getElementById("notificationButton");

    const totalOrders = document.getElementById("totalOrders");
    const pendingOrders = document.getElementById("pendingOrders");
    const processingOrders = document.getElementById("processingOrders");
    const completedOrders = document.getElementById("completedOrders");

    const searchOrders = document.getElementById("searchOrders");
    const clearSearch = document.getElementById("clearSearch");
    const statusFilter = document.getElementById("statusFilter");
    const paymentFilter = document.getElementById("paymentFilter");
    const resetFilters = document.getElementById("resetFilters");

    const ordersTableBody = document.getElementById("ordersTableBody");
    const emptyState = document.getElementById("emptyState");

    const recordCount = document.getElementById("recordCount");
    const tableInformation = document.getElementById("tableInformation");

    const addOrderButton = document.getElementById("addOrderButton");
    const emptyCreateButton = document.getElementById("emptyCreateButton");

    const orderModal = document.getElementById("orderModal");
    const orderForm = document.getElementById("orderForm");

    const modalTitle = document.getElementById("modalTitle");
    const editOrderId = document.getElementById("editOrderId");

    const customerName = document.getElementById("customerName");
    const customerContact = document.getElementById("customerContact");
    const printingService = document.getElementById("printingService");
    const quantity = document.getElementById("quantity");
    const unitPrice = document.getElementById("unitPrice");

    const orderDate = document.getElementById("orderDate");
    const dueDate = document.getElementById("dueDate");

    const orderStatus = document.getElementById("orderStatus");
    const paymentStatus = document.getElementById("paymentStatus");
    const amountPaid = document.getElementById("amountPaid");
    const orderNotes = document.getElementById("orderNotes");
    const assignedStaff = document.getElementById("assignedStaff");

    const orderTotalPreview = document.getElementById("orderTotalPreview");
    const formMessage = document.getElementById("formMessage");

    const closeOrderModal = document.getElementById("closeOrderModal");
    const cancelOrderButton = document.getElementById("cancelOrderButton");
    const saveOrderButton = document.getElementById("saveOrderButton");

    const viewOrderModal = document.getElementById("viewOrderModal");
    const orderDetailsContent = document.getElementById("orderDetailsContent");

    const closeViewModal = document.getElementById("closeViewModal");
    const closeViewButton = document.getElementById("closeViewButton");
    const editFromViewButton = document.getElementById("editFromViewButton");

    const exportOrdersButton = document.getElementById("exportOrdersButton");
    const exportExcelButton = document.getElementById("exportExcelButton");

    const toastMessage = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");
    const toastIcon = document.getElementById("toastIcon");

    let orders = loadOrders();
    let selectedViewOrderId = null;
    let toastTimer = null;


    /* =====================================================
       2. HELPER FUNCTIONS
    ===================================================== */

    function loadOrders() {

        try {
            const savedOrders = localStorage.getItem(ORDERS_KEY);

            if (!savedOrders) {
                return [];
            }

            const parsedOrders = JSON.parse(savedOrders);

            return Array.isArray(parsedOrders) ? parsedOrders : [];

        } catch (error) {
            console.error("Unable to load orders:", error);
            return [];
        }
    }


    function saveOrders() {

        try {

            // I-save muna sa server (PostgreSQL) para makita ng Staff ang naka-assign sa kanila.
            if (window.PrintifyAPI) {

                const result = window.PrintifyAPI.syncOrders(orders);

                if (!result.ok) {
                    showToast(result.message || "Unable to save the order to the server.", "error");
                    return false;
                }

            }

            localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
            return true;

        } catch (error) {
            console.error("Unable to save orders:", error);

            showToast(
                "Unable to save orders. Browser storage may be full.",
                "error"
            );

            return false;
        }
    }


    function loadStaffOptions() {

        try {
            const saved = JSON.parse(localStorage.getItem("printifyStaff") || "[]");
            return Array.isArray(saved) ? saved : [];
        } catch (error) {
            return [];
        }
    }


    // Punan ang "Assign to Staff" ng mga Staff na pwedeng bigyan ng order.
    function populateStaffSelect(selectedId, selectedName) {

        if (!assignedStaff) {
            return;
        }

        assignedStaff.innerHTML = "";

        const none = document.createElement("option");
        none.value = "";
        none.textContent = "Auto-assign to next active staff";
        assignedStaff.appendChild(none);

        let found = false;

        loadStaffOptions().forEach(function (staff) {

            const isSelected = staff.userId === selectedId;

            // Hindi na lalabas ang Inactive, maliban kung siya ang kasalukuyang naka-assign.
            if (staff.status === "Inactive" && !isSelected) {
                return;
            }

            const option = document.createElement("option");
            option.value = staff.userId;
            option.textContent = staff.name + (staff.position ? " - " + staff.position : "");
            assignedStaff.appendChild(option);

            if (isSelected) {
                found = true;
            }
        });

        if (selectedId && !found) {

            const option = document.createElement("option");
            option.value = selectedId;
            option.textContent = selectedName || "Former staff";
            assignedStaff.appendChild(option);
        }

        assignedStaff.value = selectedId || "";
    }


    function getAssignedStaffName(id) {

        if (!id) {
            return "";
        }

        const match = loadStaffOptions().find(function (staff) {
            return staff.userId === id;
        });

        return match ? match.name : "";
    }


    function escapeHTML(value) {

        return String(value ?? "").replace(/[&<>"']/g, function (character) {

            const entities = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            };

            return entities[character];
        });
    }


    function formatCurrency(value) {

        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2
        }).format(Number(value) || 0);
    }


    function formatDate(dateValue) {

        if (!dateValue) {
            return "—";
        }

        const parts = dateValue.split("-");

        if (parts.length !== 3) {
            return dateValue;
        }

        const date = new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

        return date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }


    function getToday() {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }


    function showToast(message, type = "success") {

        if (!toastMessage || !toastText) {
            return;
        }

        clearTimeout(toastTimer);

        toastText.textContent = message;

        toastMessage.classList.remove("error");

        if (type === "error") {

            toastMessage.classList.add("error");

            if (toastIcon) {
                toastIcon.className = "fa-solid fa-circle-exclamation";
            }

        } else {

            if (toastIcon) {
                toastIcon.className = "fa-solid fa-circle-check";
            }
        }

        toastMessage.classList.add("show");

        toastTimer = setTimeout(function () {
            toastMessage.classList.remove("show");
        }, 3000);
    }


    function getInitials(name) {

        return String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    }


    function generateOrderId() {

        let highestNumber = 0;

        orders.forEach(function (order) {

            const match = String(order.id || "").match(/ORD-(\d+)/);

            if (match) {
                highestNumber = Math.max(
                    highestNumber,
                    Number(match[1])
                );
            }
        });

        return "ORD-" + String(highestNumber + 1).padStart(4, "0");
    }


    function getStatusClass(status) {

        return String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");
    }


    function getPaymentClass(status) {

        return String(status || "")
            .toLowerCase()
            .replace(/\s+/g, "-");
    }


    /* =====================================================
       3. CURRENT DATE AND YEAR
    ===================================================== */

    if (currentDate) {

        const dateText = currentDate.querySelector("span");

        if (dateText) {
            dateText.textContent = new Date().toLocaleDateString("en-PH", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric"
            });
        }
    }

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }


    /* =====================================================
       4. SIDEBAR TOGGLE
    ===================================================== */

    function isMobileView() {
        return window.matchMedia("(max-width: 850px)").matches;
    }


    function setSidebarState(hidden, save = true) {

        if (!sidebar) {
            return;
        }

        sidebar.classList.toggle("is-hidden", hidden);
        document.body.classList.toggle("sidebar-hidden", hidden);

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", String(!hidden));
        }

        if (sidebarOverlay) {
            sidebarOverlay.classList.toggle(
                "show",
                !hidden && isMobileView()
            );
        }

        if (save && !isMobileView()) {
            localStorage.setItem(SIDEBAR_KEY, String(hidden));
        }
    }


    if (sidebar) {

        const savedSidebarState = localStorage.getItem(SIDEBAR_KEY);

        if (isMobileView()) {
            setSidebarState(true, false);
        } else if (savedSidebarState !== null) {
            setSidebarState(savedSidebarState === "true", false);
        } else {
            setSidebarState(false, false);
        }
    }


    if (menuToggle) {

        menuToggle.addEventListener("click", function () {

            const currentlyHidden = sidebar
                ? sidebar.classList.contains("is-hidden")
                : true;

            setSidebarState(!currentlyHidden);
        });
    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener("click", function () {
            setSidebarState(true);
        });
    }


    window.addEventListener("resize", function () {

        if (isMobileView()) {
            setSidebarState(true, false);
        } else {
            const savedState = localStorage.getItem(SIDEBAR_KEY);
            setSidebarState(savedState === "true", false);
        }
    });


    /* =====================================================
       5. THEME TOGGLE
    ===================================================== */

    function applyTheme(theme) {

        const isDark = theme === "dark";

        document.body.classList.toggle("dark-mode", isDark);

        if (themeIcon) {
            themeIcon.src = isDark
                ? "image/nightmode_icon.png"
                : "image/lightmode_icon.png";

            themeIcon.alt = isDark ? "Dark mode" : "Light mode";
        }

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );
        }
    }


    const savedTheme = localStorage.getItem(THEME_KEY);

    applyTheme(savedTheme || "dark");


    if (themeToggle) {

        themeToggle.addEventListener("click", function () {

            const isDark = document.body.classList.contains("dark-mode");
            const newTheme = isDark ? "light" : "dark";

            localStorage.setItem(THEME_KEY, newTheme);
            applyTheme(newTheme);
        });
    }


    /* =====================================================
       6. PROFILE DROPDOWN
    ===================================================== */

    if (profileButton && profileDropdown) {

        profileButton.addEventListener("click", function (event) {

            event.stopPropagation();

            const isOpen = profileDropdown.classList.toggle("show");

            profileButton.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", function (event) {

            if (
                !profileDropdown.contains(event.target) &&
                !profileButton.contains(event.target)
            ) {
                profileDropdown.classList.remove("show");
                profileButton.setAttribute("aria-expanded", "false");
            }
        });
    }


    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            const confirmLogout = confirm("Are you sure you want to log out?");

            if (confirmLogout) {
                (window.PrintifyAPI ? PrintifyAPI.logout() : (window.location.href = "login.html"));
            }
        });
    }


    if (notificationButton) {

        notificationButton.addEventListener("click", function () {
            showToast("You are all caught up with your notifications.");
        });
    }


    /* =====================================================
       7. ORDER TOTAL COMPUTATION
    ===================================================== */

    function calculateTotal() {

        const qty = Number(quantity.value) || 0;
        const price = Number(unitPrice.value) || 0;

        const total = qty * price;

        if (orderTotalPreview) {
            orderTotalPreview.textContent = formatCurrency(total);
        }

        return total;
    }


    if (quantity) {
        quantity.addEventListener("input", calculateTotal);
    }

    if (unitPrice) {
        unitPrice.addEventListener("input", calculateTotal);
    }


    /* =====================================================
       8. MODAL CONTROLS
    ===================================================== */

    function openOrderModal(editing = false) {

        if (!orderModal) {
            return;
        }

        orderModal.classList.add("show");
        orderModal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");

        if (modalTitle) {
            modalTitle.textContent = editing
                ? "Edit Order"
                : "Create New Order";
        }

        if (saveOrderButton) {
            saveOrderButton.innerHTML = editing
                ? '<i class="fa-solid fa-floppy-disk"></i> Update Order'
                : '<i class="fa-solid fa-floppy-disk"></i> Save Order';
        }

        if (formMessage) {
            formMessage.textContent = "";
            formMessage.classList.remove("show");
        }

        setTimeout(function () {

            if (customerName) {
                customerName.focus();
            }

        }, 100);
    }


    function closeOrderModalFunction() {

        if (!orderModal) {
            return;
        }

        orderModal.classList.remove("show");
        orderModal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");
    }


    function openViewModal() {

        if (!viewOrderModal) {
            return;
        }

        viewOrderModal.classList.add("show");
        viewOrderModal.setAttribute("aria-hidden", "false");

        document.body.classList.add("modal-open");
    }


    function closeViewModalFunction() {

        if (!viewOrderModal) {
            return;
        }

        viewOrderModal.classList.remove("show");
        viewOrderModal.setAttribute("aria-hidden", "true");

        document.body.classList.remove("modal-open");
    }


    function resetOrderForm() {

        if (!orderForm) {
            return;
        }

        orderForm.reset();

        editOrderId.value = "";

        quantity.value = "1";
        amountPaid.value = "0";

        orderDate.value = getToday();
        dueDate.value = getToday();

        orderStatus.value = "Pending";
        paymentStatus.value = "Unpaid";

        populateStaffSelect("", "");

        if (formMessage) {
            formMessage.textContent = "";
            formMessage.classList.remove("show");
        }

        calculateTotal();
    }


    function showFormError(message) {

        if (!formMessage) {
            return;
        }

        formMessage.textContent = message;
        formMessage.classList.add("show");
    }


    if (addOrderButton) {

        addOrderButton.addEventListener("click", function () {

            resetOrderForm();
            openOrderModal(false);
        });
    }


    if (emptyCreateButton) {

        emptyCreateButton.addEventListener("click", function () {

            resetOrderForm();
            openOrderModal(false);
        });
    }


    if (closeOrderModal) {
        closeOrderModal.addEventListener("click", closeOrderModalFunction);
    }

    if (cancelOrderButton) {
        cancelOrderButton.addEventListener("click", closeOrderModalFunction);
    }

    if (closeViewModal) {
        closeViewModal.addEventListener("click", closeViewModalFunction);
    }

    if (closeViewButton) {
        closeViewButton.addEventListener("click", closeViewModalFunction);
    }


    if (orderModal) {

        orderModal.addEventListener("click", function (event) {

            if (event.target === orderModal) {
                closeOrderModalFunction();
            }
        });
    }


    if (viewOrderModal) {

        viewOrderModal.addEventListener("click", function (event) {

            if (event.target === viewOrderModal) {
                closeViewModalFunction();
            }
        });
    }


    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape") {
            closeOrderModalFunction();
            closeViewModalFunction();
        }
    });


    /* =====================================================
       9. CREATE AND UPDATE ORDER
    ===================================================== */

    if (orderForm) {

        orderForm.addEventListener("submit", function (event) {

            event.preventDefault();

            const name = customerName.value.trim();
            const contact = customerContact.value.trim();
            const service = printingService.value;

            const qty = Number(quantity.value);
            const price = Number(unitPrice.value);

            const paid = Number(amountPaid.value) || 0;
            const total = qty * price;

            const date = orderDate.value;
            const due = dueDate.value;

            const status = orderStatus.value;
            const payment = paymentStatus.value;

            const notes = orderNotes.value.trim();

            if (!name) {
                showFormError("Please enter the customer's name.");
                customerName.focus();
                return;
            }

            if (!service) {
                showFormError("Please select a printing service.");
                printingService.focus();
                return;
            }

            if (!Number.isInteger(qty) || qty < 1 || qty > 100000) {
                showFormError("Please enter a valid quantity.");
                quantity.focus();
                return;
            }

            if (!Number.isFinite(price) || price < 0) {
                showFormError("Please enter a valid unit price.");
                unitPrice.focus();
                return;
            }

            if (!date || !due) {
                showFormError("Please provide the order date and due date.");
                return;
            }

            if (due < date) {
                showFormError("Due date cannot be earlier than the order date.");
                dueDate.focus();
                return;
            }

            if (!Number.isFinite(paid) || paid < 0) {
                showFormError("Please enter a valid amount paid.");
                amountPaid.focus();
                return;
            }

            if (paid > total) {
                showFormError("Amount paid cannot be greater than the order total.");
                amountPaid.focus();
                return;
            }

            if (payment === "Unpaid" && paid !== 0) {
                showFormError("Unpaid orders must have an amount paid of ₱0.00.");
                return;
            }

            if (payment === "Partially Paid" && (paid <= 0 || paid >= total)) {
                showFormError("Partially Paid orders must have a payment greater than ₱0 and less than the total.");
                return;
            }

            if (payment === "Paid" && paid !== total) {
                showFormError("For Paid orders, the amount paid must equal the order total.");
                return;
            }

            const existingId = editOrderId.value;

            const orderData = {
                id: existingId || generateOrderId(),
                customerName: name,
                customerContact: contact,
                printingService: service,
                quantity: qty,
                unitPrice: price,
                total: total,
                orderDate: date,
                dueDate: due,
                orderStatus: status,
                paymentStatus: payment,
                amountPaid: paid,
                notes: notes,
                assignedStaffId: assignedStaff && assignedStaff.value ? assignedStaff.value : null,
                assignedStaffName: assignedStaff && assignedStaff.value
                    ? getAssignedStaffName(assignedStaff.value) : "",
                updatedAt: new Date().toISOString()
            };


            if (existingId) {

                const orderIndex = orders.findIndex(function (order) {
                    return order.id === existingId;
                });

                if (orderIndex === -1) {
                    showFormError("The selected order could not be found.");
                    return;
                }

                orderData.createdAt =
                    orders[orderIndex].createdAt || new Date().toISOString();

                orders[orderIndex] = orderData;

                if (!saveOrders()) {
                    return;
                }

                showToast("Order updated successfully.");

            } else {

                orderData.createdAt = new Date().toISOString();

                orders.unshift(orderData);

                if (!saveOrders()) {
                    orders.shift();
                    return;
                }

                showToast("New order created successfully.");
            }

            renderOrders();
            closeOrderModalFunction();
            resetOrderForm();
        });
    }


    /* =====================================================
       10. FILTER ORDERS
    ===================================================== */

    function getFilteredOrders() {

        const searchText = searchOrders
            ? searchOrders.value.trim().toLowerCase()
            : "";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "All";

        const selectedPayment = paymentFilter
            ? paymentFilter.value
            : "All";

        return orders.filter(function (order) {

            const searchableText = [
                order.id,
                order.customerName,
                order.customerContact,
                order.printingService
            ].join(" ").toLowerCase();

            const matchesSearch =
                !searchText || searchableText.includes(searchText);

            const matchesStatus =
                selectedStatus === "All" ||
                order.orderStatus === selectedStatus;

            const matchesPayment =
                selectedPayment === "All" ||
                order.paymentStatus === selectedPayment;

            return matchesSearch && matchesStatus && matchesPayment;
        });
    }


    /* =====================================================
       11. RENDER ORDER TABLE
    ===================================================== */

    function renderOrders() {

        if (!ordersTableBody) {
            return;
        }

        const filteredOrders = getFilteredOrders();

        ordersTableBody.innerHTML = "";

        filteredOrders.forEach(function (order) {

            const row = document.createElement("tr");

            const initials = getInitials(order.customerName);

            const statusClass = getStatusClass(order.orderStatus);
            const paymentClass = getPaymentClass(order.paymentStatus);

            row.innerHTML = `
                <td>
                    <div class="order-id">
                        <strong>${escapeHTML(order.id)}</strong>
                        <span>${escapeHTML(order.quantity)} item(s)</span>
                    </div>
                </td>

                <td>
                    <div class="order-customer">
                        <div class="order-customer-avatar">
                            ${escapeHTML(initials || "C")}
                        </div>

                        <div class="order-customer-information">
                            <strong>${escapeHTML(order.customerName)}</strong>
                            <span>${escapeHTML(order.customerContact || "No contact number")}</span>
                        </div>
                    </div>
                </td>

                <td>
                    <span class="service-name">
                        ${escapeHTML(order.printingService)}
                    </span>
                </td>

                <td>
                    <span class="service-name">
                        ${escapeHTML(order.assignedStaffName || "Unassigned")}
                    </span>
                </td>

                <td>
                    <div class="order-date">
                        <strong>${escapeHTML(formatDate(order.orderDate))}</strong>
                    </div>
                </td>

                <td>
                    <div class="order-date">
                        <strong>${escapeHTML(formatDate(order.dueDate))}</strong>
                    </div>
                </td>

                <td>
                    <strong class="order-price">
                        ${escapeHTML(formatCurrency(order.total))}
                    </strong>
                </td>

                <td>
                    <span class="payment-status ${escapeHTML(paymentClass)}">
                        ${escapeHTML(order.paymentStatus)}
                    </span>
                </td>

                <td>
                    <span class="order-status ${escapeHTML(statusClass)}">
                        ${escapeHTML(order.orderStatus)}
                    </span>
                </td>

                <td>
                    <div class="order-actions">

                        <button
                            type="button"
                            class="action-button"
                            data-action="view"
                            data-id="${escapeHTML(order.id)}"
                            title="View Order"
                            aria-label="View order">

                            <i class="fa-regular fa-eye"></i>
                        </button>

                        <button
                            type="button"
                            class="action-button"
                            data-action="edit"
                            data-id="${escapeHTML(order.id)}"
                            title="Edit Order"
                            aria-label="Edit order">

                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            type="button"
                            class="action-button delete"
                            data-action="delete"
                            data-id="${escapeHTML(order.id)}"
                            title="Delete Order"
                            aria-label="Delete order">

                            <i class="fa-solid fa-trash"></i>
                        </button>

                    </div>
                </td>
            `;

            ordersTableBody.appendChild(row);
        });


        // Empty state
        if (emptyState) {
            emptyState.hidden = filteredOrders.length !== 0;
        }


        // Record count
        if (recordCount) {
            recordCount.textContent =
                filteredOrders.length + " record(s)";
        }


        // Table information
        if (tableInformation) {
            tableInformation.textContent =
                `Showing ${filteredOrders.length} of ${orders.length} orders`;
        }


        updateStatistics();
        updateClearSearchButton();
    }


    /* =====================================================
       12. UPDATE STATISTICS
    ===================================================== */

    function updateStatistics() {

        const total = orders.length;

        const pending = orders.filter(order =>
            order.orderStatus === "Pending"
        ).length;

        const processing = orders.filter(order =>
            order.orderStatus === "In Progress"
        ).length;

        const completed = orders.filter(order =>
            order.orderStatus === "Completed"
        ).length;

        if (totalOrders) {
            totalOrders.textContent = total;
        }

        if (pendingOrders) {
            pendingOrders.textContent = pending;
        }

        if (processingOrders) {
            processingOrders.textContent = processing;
        }

        if (completedOrders) {
            completedOrders.textContent = completed;
        }
    }


    /* =====================================================
       13. SEARCH AND FILTER EVENTS
    ===================================================== */

    function updateClearSearchButton() {

        if (!clearSearch || !searchOrders) {
            return;
        }

        clearSearch.classList.toggle(
            "show",
            searchOrders.value.length > 0
        );
    }


    if (searchOrders) {

        searchOrders.addEventListener("input", function () {
            renderOrders();
        });
    }


    if (clearSearch) {

        clearSearch.addEventListener("click", function () {

            searchOrders.value = "";

            renderOrders();
            searchOrders.focus();
        });
    }


    if (statusFilter) {
        statusFilter.addEventListener("change", renderOrders);
    }

    if (paymentFilter) {
        paymentFilter.addEventListener("change", renderOrders);
    }


    if (resetFilters) {

        resetFilters.addEventListener("click", function () {

            if (searchOrders) {
                searchOrders.value = "";
            }

            if (statusFilter) {
                statusFilter.value = "All";
            }

            if (paymentFilter) {
                paymentFilter.value = "All";
            }

            renderOrders();

            showToast("Filters have been reset.");
        });
    }


    /* =====================================================
       14. VIEW ORDER
    ===================================================== */

    function viewOrder(id) {

        const order = orders.find(item => item.id === id);

        if (!order) {
            showToast("Order not found.", "error");
            return;
        }

        selectedViewOrderId = id;

        const balance = Number(order.total) - Number(order.amountPaid || 0);

        orderDetailsContent.innerHTML = `
            <div class="details-heading">

                <div class="details-order-icon">
                    <i class="fa-solid fa-receipt"></i>
                </div>

                <div>
                    <h3>${escapeHTML(order.id)}</h3>
                    <p>Customer order information</p>
                </div>

            </div>

            <div class="details-grid">

                <div class="detail-item">
                    <span>Customer Name</span>
                    <strong>${escapeHTML(order.customerName)}</strong>
                </div>

                <div class="detail-item">
                    <span>Contact Number</span>
                    <strong>${escapeHTML(order.customerContact || "Not provided")}</strong>
                </div>

                <div class="detail-item">
                    <span>Printing Service</span>
                    <strong>${escapeHTML(order.printingService)}</strong>
                </div>

                <div class="detail-item">
                    <span>Assigned Staff</span>
                    <strong>${escapeHTML(order.assignedStaffName || "Unassigned")}</strong>
                </div>

                <div class="detail-item">
                    <span>Quantity</span>
                    <strong>${escapeHTML(order.quantity)}</strong>
                </div>

                <div class="detail-item">
                    <span>Price per Unit</span>
                    <strong>${escapeHTML(formatCurrency(order.unitPrice))}</strong>
                </div>

                <div class="detail-item">
                    <span>Order Date</span>
                    <strong>${escapeHTML(formatDate(order.orderDate))}</strong>
                </div>

                <div class="detail-item">
                    <span>Due Date</span>
                    <strong>${escapeHTML(formatDate(order.dueDate))}</strong>
                </div>

                <div class="detail-item">
                    <span>Order Status</span>
                    <strong>
                        <span class="order-status ${escapeHTML(getStatusClass(order.orderStatus))}">
                            ${escapeHTML(order.orderStatus)}
                        </span>
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Payment Status</span>
                    <strong>
                        <span class="payment-status ${escapeHTML(getPaymentClass(order.paymentStatus))}">
                            ${escapeHTML(order.paymentStatus)}
                        </span>
                    </strong>
                </div>

                <div class="detail-item">
                    <span>Amount Paid</span>
                    <strong>${escapeHTML(formatCurrency(order.amountPaid))}</strong>
                </div>

                <div class="detail-item">
                    <span>Remaining Balance</span>
                    <strong>${escapeHTML(formatCurrency(balance))}</strong>
                </div>

                <div class="detail-item detail-total">
                    <span>Order Total</span>
                    <strong>${escapeHTML(formatCurrency(order.total))}</strong>
                </div>

                <div class="detail-item full-width">
                    <span>Order Notes</span>
                    <strong>${escapeHTML(order.notes || "No additional notes.")}</strong>
                </div>

            </div>
        `;

        openViewModal();
    }


    /* =====================================================
       15. EDIT ORDER
    ===================================================== */

    function editOrder(id) {

        const order = orders.find(item => item.id === id);

        if (!order) {
            showToast("Order not found.", "error");
            return;
        }

        resetOrderForm();

        editOrderId.value = order.id;

        customerName.value = order.customerName || "";
        customerContact.value = order.customerContact || "";
        printingService.value = order.printingService || "";

        quantity.value = order.quantity || 1;
        unitPrice.value = order.unitPrice || 0;

        orderDate.value = order.orderDate || getToday();
        dueDate.value = order.dueDate || getToday();

        orderStatus.value = order.orderStatus || "Pending";
        paymentStatus.value = order.paymentStatus || "Unpaid";

        amountPaid.value = order.amountPaid || 0;
        orderNotes.value = order.notes || "";

        populateStaffSelect(order.assignedStaffId || "", order.assignedStaffName || "");

        calculateTotal();

        closeViewModalFunction();
        openOrderModal(true);
    }


    if (editFromViewButton) {

        editFromViewButton.addEventListener("click", function () {

            if (selectedViewOrderId) {
                editOrder(selectedViewOrderId);
            }
        });
    }


    /* =====================================================
       16. DELETE ORDER
    ===================================================== */

    function deleteOrder(id) {

        const order = orders.find(item => item.id === id);

        if (!order) {
            showToast("Order not found.", "error");
            return;
        }

        const confirmDelete = confirm(
            `Are you sure you want to delete ${order.id}?`
        );

        if (!confirmDelete) {
            return;
        }

        const previousOrders = [...orders];

        orders = orders.filter(item => item.id !== id);

        if (!saveOrders()) {
            orders = previousOrders;
            return;
        }

        renderOrders();

        showToast("Order deleted successfully.");
    }


    /* =====================================================
       17. TABLE ACTION EVENTS
    ===================================================== */

    if (ordersTableBody) {

        ordersTableBody.addEventListener("click", function (event) {

            const button = event.target.closest("[data-action]");

            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const id = button.dataset.id;

            if (action === "view") {
                viewOrder(id);
            }

            if (action === "edit") {
                editOrder(id);
            }

            if (action === "delete") {
                deleteOrder(id);
            }
        });
    }


    /* =====================================================
       18. CSV EXPORT
    ===================================================== */

    function getExportRows() {

        const filteredOrders = getFilteredOrders();

        return filteredOrders.map(function (order) {

            return [
                order.id,
                order.customerName,
                order.customerContact || "",
                order.printingService,
                order.quantity,
                order.unitPrice,
                order.orderDate,
                order.dueDate,
                order.total,
                order.amountPaid,
                Number(order.total) - Number(order.amountPaid || 0),
                order.paymentStatus,
                order.orderStatus,
                order.assignedStaffName || "Unassigned",
                order.notes || ""
            ];
        });
    }


    function getExportHeadings() {

        return [
            "Order ID",
            "Customer Name",
            "Contact Number",
            "Printing Service",
            "Quantity",
            "Unit Price",
            "Order Date",
            "Due Date",
            "Total",
            "Amount Paid",
            "Remaining Balance",
            "Payment Status",
            "Order Status",
            "Assigned Staff",
            "Notes"
        ];
    }


    function getExportFileDate() {

        return getToday();
    }


    if (exportOrdersButton) {

        exportOrdersButton.addEventListener("click", function () {

            const rows = getExportRows();

            if (rows.length === 0) {
                showToast("There are no orders to export.", "error");
                return;
            }

            const csvData = [
                getExportHeadings(),
                ...rows
            ];

            const csvContent = csvData.map(function (row) {

                return row.map(function (value) {

                    let safeValue = String(value ?? "");

                    safeValue = safeValue.replace(/"/g, '""');

                    return `"${safeValue}"`;

                }).join(",");

            }).join("\r\n");

            const blob = new Blob(
                ["\uFEFF" + csvContent],
                { type: "text/csv;charset=utf-8;" }
            );

            const url = URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;
            link.download = `Printify_Orders_${getExportFileDate()}.csv`;

            document.body.appendChild(link);

            link.click();
            link.remove();

            URL.revokeObjectURL(url);

            showToast("CSV file exported successfully.");
        });
    }


    /* =====================================================
       19. EXCEL EXPORT
    ===================================================== */

    if (exportExcelButton) {

        exportExcelButton.addEventListener("click", function () {

            if (typeof XLSX === "undefined") {

                showToast(
                    "Excel library is unavailable. Check your internet connection.",
                    "error"
                );

                return;
            }

            const rows = getExportRows();

            if (rows.length === 0) {
                showToast("There are no orders to export.", "error");
                return;
            }

            const worksheetData = [
                getExportHeadings(),
                ...rows
            ];

            const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

            worksheet["!cols"] = [
                { wch: 15 },
                { wch: 25 },
                { wch: 18 },
                { wch: 24 },
                { wch: 12 },
                { wch: 15 },
                { wch: 16 },
                { wch: 16 },
                { wch: 16 },
                { wch: 16 },
                { wch: 19 },
                { wch: 20 },
                { wch: 18 },
                { wch: 35 }
            ];

            worksheet["!autofilter"] = {
                ref: worksheet["!ref"]
            };

            const workbook = XLSX.utils.book_new();

            XLSX.utils.book_append_sheet(
                workbook,
                worksheet,
                "Customer Orders"
            );

            XLSX.writeFile(
                workbook,
                `Printify_Orders_${getExportFileDate()}.xlsx`
            );

            showToast("Excel file exported successfully.");
        });
    }


    /* =====================================================
       20. INITIALIZE PAGE
    ===================================================== */

    renderOrders();

    resetOrderForm();


    /* =====================================================
       21. LIVE REFRESH
       Kapag nag-update ng status ang Staff, lalabas dito
       nang hindi kailangang i-refresh ang page.
    ===================================================== */

    setInterval(function () {

        if (!window.PrintifyAPI || document.hidden) {
            return;
        }

        const modalOpen =
            (orderModal && orderModal.classList.contains("show")) ||
            (viewOrderModal && viewOrderModal.classList.contains("show"));

        if (modalOpen) {
            return;
        }

        const fresh = window.PrintifyAPI.fetchOrders();
        const staff = window.PrintifyAPI.fetchStaff();

        if (fresh && JSON.stringify(fresh) !== JSON.stringify(orders)) {
            orders = fresh;
            renderOrders();
        }

    }, 15000);

});
