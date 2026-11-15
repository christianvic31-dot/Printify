/* =========================================================
   PRINTIFY CALAPAN
   INVENTORY PAGE JAVASCRIPT
   Dashboard-Matched Functionality
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // ==================================================
    // 1. ELEMENTS
    // ==================================================

    const body = document.body;

    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const menuToggle = document.getElementById("menuToggle");

    const themeToggle = document.getElementById("themeToggle");
    const themeIcon = document.getElementById("themeIcon");

    const profileButton = document.getElementById("profileButton");
    const profileDropdown = document.getElementById("profileDropdown");
    const logoutButton = document.getElementById("logoutButton");

    const notificationButton = document.getElementById("notificationButton");

    const currentDate = document.getElementById("currentDate");
    const currentYear = document.getElementById("currentYear");

    const totalProducts = document.getElementById("totalProducts");
    const inStockProducts = document.getElementById("inStockProducts");
    const lowStockProducts = document.getElementById("lowStockProducts");
    const outOfStockProducts = document.getElementById("outOfStockProducts");

    const searchInput = document.getElementById("searchInput");
    const categoryFilter = document.getElementById("categoryFilter");
    const stockFilter = document.getElementById("stockFilter");

    const inventoryTableBody = document.getElementById("inventoryTableBody");
    const resultsCount = document.getElementById("resultsCount");

    const addProductButton = document.getElementById("addProductButton");
    const productModal = document.getElementById("productModal");
    const closeModalButton = document.getElementById("closeModalButton");
    const cancelModalButton = document.getElementById("cancelModalButton");
    const productForm = document.getElementById("productForm");

    const modalTitle = document.getElementById("modalTitle");

    const productIdInput = document.getElementById("productId");
    const productNameInput = document.getElementById("productName");
    const productCategoryInput = document.getElementById("productCategory");
    const productQuantityInput = document.getElementById("productQuantity");
    const productUnitInput = document.getElementById("productUnit");
    const productPriceInput = document.getElementById("productPrice");
    const lowStockThresholdInput = document.getElementById("lowStockThreshold");

    const resetFiltersButton = document.getElementById("resetFiltersButton");

    const toastMessage = document.getElementById("toastMessage");
    const toastText = document.getElementById("toastText");

    const mobileScreen = window.matchMedia("(max-width: 850px)");

    let toastTimer;


    // ==================================================
    // 2. DATE AND YEAR
    // ==================================================

    function updateDate() {

        if (!currentDate) return;

        const dateText = currentDate.querySelector("span");

        if (dateText) {
            dateText.textContent = new Date().toLocaleDateString("en-PH", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric"
            });
        }

    }

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    updateDate();


    // ==================================================
    // 3. SIDEBAR SHOW AND HIDE
    // Same behavior as Dashboard
    // ==================================================

    function saveSidebarState(isHidden) {

        try {

            localStorage.setItem(
                "printify-sidebar-hidden",
                String(isHidden)
            );

        } catch (error) {

            console.warn("Unable to save sidebar preference.");

        }

    }


    function closeMobileSidebar() {

        if (!sidebar) return;

        sidebar.classList.add("is-hidden");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("show");
        }

        body.classList.remove("mobile-sidebar-open");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }

    }


    function openMobileSidebar() {

        if (!sidebar) return;

        sidebar.classList.remove("is-hidden");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("show");
        }

        body.classList.add("mobile-sidebar-open");

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
        }

    }


    function updateDesktopSidebar() {

        if (!sidebar) return;

        let isHidden = true;

        try {

            const savedState = localStorage.getItem(
                "printify-sidebar-hidden"
            );

            if (savedState === null) {

                isHidden = true;
                saveSidebarState(true);

            } else {

                isHidden = savedState === "true";

            }

        } catch (error) {

            isHidden = true;

        }

        sidebar.classList.toggle("is-hidden", isHidden);

        body.classList.toggle("sidebar-hidden", isHidden);

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("show");
        }

        body.classList.remove("mobile-sidebar-open");

        if (menuToggle) {
            menuToggle.setAttribute(
                "aria-expanded",
                String(!isHidden)
            );
        }

    }


    function updateSidebarForScreen() {

        if (!sidebar) return;

        if (mobileScreen.matches) {

            sidebar.classList.add("is-hidden");

            if (sidebarOverlay) {
                sidebarOverlay.classList.remove("show");
            }

            body.classList.remove("mobile-sidebar-open");

            if (menuToggle) {
                menuToggle.setAttribute("aria-expanded", "false");
            }

        } else {

            updateDesktopSidebar();

        }

    }


    if (menuToggle) {

        menuToggle.addEventListener("click", function () {

            if (!sidebar) return;

            if (mobileScreen.matches) {

                const isOpen = !sidebar.classList.contains("is-hidden");

                if (isOpen) {
                    closeMobileSidebar();
                } else {
                    openMobileSidebar();
                }

            } else {

                const isHidden = sidebar.classList.toggle("is-hidden");

                body.classList.toggle("sidebar-hidden", isHidden);

                saveSidebarState(isHidden);

                menuToggle.setAttribute(
                    "aria-expanded",
                    String(!isHidden)
                );

            }

        });

    }


    if (sidebarOverlay) {

        sidebarOverlay.addEventListener("click", function () {
            closeMobileSidebar();
        });

    }


    if (sidebar) {

        sidebar.querySelectorAll(".nav-link").forEach(function (link) {

            link.addEventListener("click", function () {

                if (mobileScreen.matches) {
                    closeMobileSidebar();
                }

            });

        });

    }


    if (typeof mobileScreen.addEventListener === "function") {

        mobileScreen.addEventListener("change", updateSidebarForScreen);

    } else {

        mobileScreen.addListener(updateSidebarForScreen);

    }

    updateSidebarForScreen();


    // ==================================================
    // 4. LIGHT MODE AND DARK MODE
    // Same storage key and icons as Dashboard
    // ==================================================

    function updateThemeIcon(isDark) {

        if (!themeIcon) return;

        themeIcon.src = isDark
            ? "image/lightmode_icon.png"
            : "image/nightmode_icon.png";

        themeIcon.alt = isDark
            ? "Switch to light mode"
            : "Switch to dark mode";

        themeIcon.classList.add("theme-image-icon");

    }


    function applyTheme(theme) {

        const isDark = theme === "dark";

        body.classList.toggle("dark-mode", isDark);

        updateThemeIcon(isDark);

        if (themeToggle) {

            const label = isDark
                ? "Switch to light mode"
                : "Switch to dark mode";

            themeToggle.setAttribute("aria-label", label);
            themeToggle.setAttribute("title", label);

        }

    }


    let savedTheme = "light";

    try {

        savedTheme = localStorage.getItem("printify-theme") || "light";

    } catch (error) {

        console.warn("Unable to load saved theme.");

    }

    applyTheme(savedTheme);


    if (themeToggle) {

        themeToggle.addEventListener("click", function () {

            const currentTheme = body.classList.contains("dark-mode")
                ? "dark"
                : "light";

            const newTheme = currentTheme === "dark"
                ? "light"
                : "dark";

            applyTheme(newTheme);

            try {

                localStorage.setItem("printify-theme", newTheme);

            } catch (error) {

                console.warn("Unable to save theme.");

            }

        });

    }


    // ==================================================
    // 5. PROFILE DROPDOWN
    // ==================================================

    if (profileButton && profileDropdown) {

        profileButton.addEventListener("click", function (event) {

            event.stopPropagation();

            const isOpen = profileDropdown.classList.toggle("show");

            profileButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        });


        profileDropdown.addEventListener("click", function (event) {
            event.stopPropagation();
        });


        document.addEventListener("click", function () {

            profileDropdown.classList.remove("show");

            profileButton.setAttribute("aria-expanded", "false");

        });


        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape") {

                profileDropdown.classList.remove("show");

                profileButton.setAttribute("aria-expanded", "false");

            }

        });

    }


    // ==================================================
    // 6. ACTIVE SIDEBAR LINK
    // ==================================================

    if (sidebar) {

        const currentPage = window.location.pathname
            .split("/")
            .pop()
            .toLowerCase();

        sidebar.querySelectorAll(".nav-link").forEach(function (link) {

            const href = link.getAttribute("href");

            if (!href) return;

            const linkPage = href
                .split("/")
                .pop()
                .toLowerCase();

            link.classList.toggle(
                "active",
                linkPage === currentPage
            );

        });

    }


    // ==================================================
    // 7. LOGOUT
    // ==================================================

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {

            const confirmLogout = confirm(
                "Are you sure you want to log out?"
            );

            if (confirmLogout) {

                (window.PrintifyAPI ? PrintifyAPI.logout() : (window.location.href = "login.html"));

            }

        });

    }


    // ==================================================
    // 8. SAMPLE INVENTORY
    // ==================================================

    // Inventory is stored in PostgreSQL through /api/inventory (see auth-guard.js).


    // ==================================================
    // 9. LOAD AND SAVE PRODUCTS
    // ==================================================

    function loadProducts() {

        const items = window.PrintifyAPI ? window.PrintifyAPI.fetchInventory() : null;

        if (!Array.isArray(items)) {
            console.error("Unable to load inventory from the server.");
            return [];
        }

        return items;

    }


    let products = loadProducts();


    // Saves the changes to PostgreSQL. Returns true on success.
    function saveProducts() {

        if (!window.PrintifyAPI) {
            showToast("Unable to reach the server.", "error");
            return false;
        }

        const result = window.PrintifyAPI.syncInventory(products);
        const fresh = window.PrintifyAPI.fetchInventory();

        if (Array.isArray(fresh)) {
            products = fresh;
        }

        if (!result.ok) {
            showToast(result.message || "Unable to save changes.", "error");
            return false;
        }

        return true;

    }


    // ==================================================
    // 10. HELPER FUNCTIONS
    // ==================================================

    function escapeHTML(value) {

        return String(value).replace(/[&<>"']/g, function (character) {

            const replacements = {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            };

            return replacements[character];

        });

    }


    function formatCurrency(value) {

        return Number(value).toLocaleString("en-PH", {
            style: "currency",
            currency: "PHP",
            minimumFractionDigits: 2
        });

    }


    function getStockStatus(product) {

        if (Number(product.quantity) === 0) {
            return "Out of Stock";
        }

        if (Number(product.quantity) <= Number(product.threshold)) {
            return "Low Stock";
        }

        return "In Stock";

    }


    function getProductIcon(category) {

        switch (category) {

            case "Paper":
                return "fa-file-lines";

            case "Ink":
                return "fa-droplet";

            case "Printing Supplies":
                return "fa-print";

            default:
                return "fa-box";

        }

    }


    function showToast(message, type = "success") {

        if (!toastMessage || !toastText) return;

        clearTimeout(toastTimer);

        toastText.textContent = message;

        const icon = toastMessage.querySelector("i");

        if (icon) {

            if (type === "error") {

                icon.className = "fa-solid fa-circle-exclamation";
                toastMessage.style.borderLeftColor = "#ff6262";
                toastMessage.style.color = "#ff8585";

            } else {

                icon.className = "fa-solid fa-circle-check";
                toastMessage.style.borderLeftColor = "#19e51b";
                toastMessage.style.color = "#25d366";

            }

        }

        toastMessage.classList.add("show");

        toastTimer = setTimeout(function () {

            toastMessage.classList.remove("show");

        }, 3000);

    }


    function generateProductId() {

        let highestNumber = 0;

        products.forEach(function (product) {

            const match = String(product.id).match(/^PRD-(\d+)$/);

            if (match) {

                highestNumber = Math.max(
                    highestNumber,
                    Number(match[1])
                );

            }

        });

        return "PRD-" + String(highestNumber + 1).padStart(3, "0");

    }


    // ==================================================
    // 11. STOCK SUMMARY
    // ==================================================

    function updateSummary() {

        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        products.forEach(function (product) {

            const status = getStockStatus(product);

            if (status === "In Stock") {

                inStock++;

            } else if (status === "Low Stock") {

                lowStock++;

            } else {

                outOfStock++;

            }

        });

        if (totalProducts) {
            totalProducts.textContent = products.length;
        }

        if (inStockProducts) {
            inStockProducts.textContent = inStock;
        }

        if (lowStockProducts) {
            lowStockProducts.textContent = lowStock;
        }

        if (outOfStockProducts) {
            outOfStockProducts.textContent = outOfStock;
        }

    }


    // ==================================================
    // 12. DISPLAY INVENTORY
    // ==================================================

    function renderProducts() {

        if (!inventoryTableBody) return;

        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedCategory = categoryFilter
            ? categoryFilter.value
            : "all";

        const selectedStock = stockFilter
            ? stockFilter.value
            : "all";


        const filteredProducts = products.filter(function (product) {

            const matchesSearch =
                String(product.name).toLowerCase().includes(searchTerm) ||
                String(product.id).toLowerCase().includes(searchTerm);

            const matchesCategory =
                selectedCategory === "all" ||
                product.category === selectedCategory;

            const matchesStock =
                selectedStock === "all" ||
                getStockStatus(product) === selectedStock;

            return matchesSearch && matchesCategory && matchesStock;

        });


        if (filteredProducts.length === 0) {

            inventoryTableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-inventory">
                        <i class="fa-solid fa-box-open"></i>
                        <strong>No products found</strong>
                        <p>Try changing your search or filters.</p>
                    </td>
                </tr>
            `;

            if (resultsCount) {
                resultsCount.textContent = "Showing 0 products";
            }

            return;

        }


        inventoryTableBody.innerHTML = filteredProducts.map(function (product) {

            const status = getStockStatus(product);

            let statusClass = "in-stock";

            if (status === "Low Stock") {

                statusClass = "low-stock";

            } else if (status === "Out of Stock") {

                statusClass = "out-of-stock";

            }


            return `
                <tr>

                    <td>
                        <div class="inventory-product">

                            <div class="inventory-product-icon">
                                <i class="fa-solid ${getProductIcon(product.category)}"></i>
                            </div>

                            <div class="inventory-product-details">
                                <strong>${escapeHTML(product.name)}</strong>
                                <span>${escapeHTML(product.id)}</span>
                            </div>

                        </div>
                    </td>

                    <td>
                        <span class="category-label">
                            ${escapeHTML(product.category)}
                        </span>
                    </td>

                    <td>
                        <span class="quantity-value">
                            ${Number(product.quantity)}
                        </span>

                        <span class="unit-label">
                            ${escapeHTML(product.unit)}
                        </span>
                    </td>

                    <td>
                        <span class="price-value">
                            ${formatCurrency(product.price)}
                        </span>
                    </td>

                    <td>
                        <span class="inventory-status ${statusClass}">
                            ${status}
                        </span>
                    </td>

                    <td>
                        <div class="inventory-actions">

                            <button
                                type="button"
                                class="action-button edit-button"
                                data-action="edit"
                                data-id="${escapeHTML(product.id)}"
                                title="Edit product"
                                aria-label="Edit ${escapeHTML(product.name)}"
                            >
                                <i class="fa-solid fa-pen"></i>
                            </button>

                            <button
                                type="button"
                                class="action-button delete-button"
                                data-action="delete"
                                data-id="${escapeHTML(product.id)}"
                                title="Delete product"
                                aria-label="Delete ${escapeHTML(product.name)}"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>

                        </div>
                    </td>

                </tr>
            `;

        }).join("");


        if (resultsCount) {

            resultsCount.textContent =
                "Showing " + filteredProducts.length +
                " of " + products.length + " products";

        }

    }


    function refreshInventory() {

        updateSummary();
        renderProducts();

    }


    // ==================================================
    // 13. OPEN ADD PRODUCT MODAL
    // ==================================================

    function openAddProductModal() {

        if (!productForm || !productModal) return;

        productForm.reset();

        productIdInput.value = "";
        lowStockThresholdInput.value = "10";

        modalTitle.textContent = "Add Product";

        productModal.classList.add("show");
        productModal.setAttribute("aria-hidden", "false");

        body.style.overflow = "hidden";

        setTimeout(function () {

            if (productNameInput) {
                productNameInput.focus();
            }

        }, 150);

    }


    // ==================================================
    // 14. OPEN EDIT PRODUCT MODAL
    // ==================================================

    function openEditProductModal(productId) {

        const product = products.find(function (item) {
            return item.id === productId;
        });

        if (!product) {

            showToast("Product not found.", "error");
            return;

        }

        productIdInput.value = product.id;
        productNameInput.value = product.name;
        productCategoryInput.value = product.category;
        productQuantityInput.value = product.quantity;
        productUnitInput.value = product.unit;
        productPriceInput.value = product.price;
        lowStockThresholdInput.value = product.threshold;

        modalTitle.textContent = "Edit Product";

        productModal.classList.add("show");
        productModal.setAttribute("aria-hidden", "false");

        body.style.overflow = "hidden";

        setTimeout(function () {

            productNameInput.focus();

        }, 150);

    }


    // ==================================================
    // 15. CLOSE PRODUCT MODAL
    // ==================================================

    function closeProductModal() {

        if (!productModal) return;

        productModal.classList.remove("show");
        productModal.setAttribute("aria-hidden", "true");

        body.style.overflow = "";

        if (productForm) {
            productForm.reset();
        }

        if (productIdInput) {
            productIdInput.value = "";
        }

    }


    // ==================================================
    // 16. SAVE PRODUCT
    // ==================================================

    if (productForm) {

        productForm.addEventListener("submit", function (event) {

            event.preventDefault();

            if (!productForm.reportValidity()) {
                return;
            }

            const existingId = productIdInput.value;

            const name = productNameInput.value.trim();
            const category = productCategoryInput.value;
            const quantity = Number(productQuantityInput.value);
            const unit = productUnitInput.value;
            const price = Number(productPriceInput.value);
            const threshold = Number(lowStockThresholdInput.value);


            if (
                !name ||
                !category ||
                !unit ||
                !Number.isInteger(quantity) ||
                quantity < 0 ||
                !Number.isFinite(price) ||
                price < 0 ||
                !Number.isInteger(threshold) ||
                threshold < 0
            ) {

                showToast(
                    "Please enter valid product details.",
                    "error"
                );

                return;

            }


            const duplicateName = products.some(function (product) {

                return (
                    product.name.toLowerCase() === name.toLowerCase() &&
                    product.id !== existingId
                );

            });


            if (duplicateName) {

                showToast(
                    "A product with that name already exists.",
                    "error"
                );

                return;

            }


            // UPDATE EXISTING PRODUCT

            if (existingId) {

                const productIndex = products.findIndex(function (product) {
                    return product.id === existingId;
                });

                if (productIndex === -1) {

                    showToast(
                        "Unable to find product to update.",
                        "error"
                    );

                    return;

                }

                products[productIndex] = {

                    ...products[productIndex],

                    name: name,
                    category: category,
                    quantity: quantity,
                    unit: unit,
                    price: price,
                    threshold: threshold

                };

                if (!saveProducts()) {

                    refreshInventory();

                    return;

                }

                refreshInventory();
                closeProductModal();

                showToast("Product updated successfully.");

            } else {

                // ADD NEW PRODUCT

                const newProduct = {

                    id: generateProductId(),
                    name: name,
                    category: category,
                    quantity: quantity,
                    unit: unit,
                    price: price,
                    threshold: threshold

                };

                products.push(newProduct);

                if (!saveProducts()) {

                    refreshInventory();

                    return;

                }

                refreshInventory();
                closeProductModal();

                showToast("Product added successfully.");

            }

        });

    }


    // ==================================================
    // 17. EDIT AND DELETE PRODUCT
    // ==================================================

    if (inventoryTableBody) {

        inventoryTableBody.addEventListener("click", function (event) {

            const button = event.target.closest("button[data-action]");

            if (!button) return;

            const action = button.dataset.action;
            const productId = button.dataset.id;


            if (action === "edit") {

                openEditProductModal(productId);
                return;

            }


            if (action === "delete") {

                const product = products.find(function (item) {
                    return item.id === productId;
                });

                if (!product) {

                    showToast("Product not found.", "error");
                    return;

                }

                const confirmed = confirm(
                    "Are you sure you want to delete \"" +
                    product.name +
                    "\" (" + product.id + ")?"
                );

                if (!confirmed) return;


                products = products.filter(function (item) {
                    return item.id !== productId;
                });

                if (!saveProducts()) {

                    refreshInventory();

                    return;

                }

                refreshInventory();

                showToast("Product deleted successfully.");

            }

        });

    }


    // ==================================================
    // 18. SEARCH AND FILTERS
    // ==================================================

    if (searchInput) {
        searchInput.addEventListener("input", renderProducts);
    }

    if (categoryFilter) {
        categoryFilter.addEventListener("change", renderProducts);
    }

    if (stockFilter) {
        stockFilter.addEventListener("change", renderProducts);
    }


    if (resetFiltersButton) {

        resetFiltersButton.addEventListener("click", function () {

            if (searchInput) {
                searchInput.value = "";
            }

            if (categoryFilter) {
                categoryFilter.value = "all";
            }

            if (stockFilter) {
                stockFilter.value = "all";
            }

            renderProducts();

            showToast("Filters have been reset.");

        });

    }


    // ==================================================
    // 19. MODAL BUTTONS
    // ==================================================

    if (addProductButton) {
        addProductButton.addEventListener("click", openAddProductModal);
    }

    if (closeModalButton) {
        closeModalButton.addEventListener("click", closeProductModal);
    }

    if (cancelModalButton) {
        cancelModalButton.addEventListener("click", closeProductModal);
    }


    if (productModal) {

        productModal.addEventListener("click", function (event) {

            if (event.target === productModal) {
                closeProductModal();
            }

        });

    }


    document.addEventListener("keydown", function (event) {

        if (
            event.key === "Escape" &&
            productModal &&
            productModal.classList.contains("show")
        ) {

            closeProductModal();

        }

    });


    // ==================================================
    // 20. NOTIFICATIONS
    // ==================================================

    if (notificationButton) {

        notificationButton.addEventListener("click", function () {

            const lowStockCount = products.filter(function (product) {

                return getStockStatus(product) !== "In Stock";

            }).length;


            if (lowStockCount > 0) {

                showToast(
                    lowStockCount +
                    " product(s) need stock attention."
                );

            } else {

                showToast(
                    "All products are sufficiently stocked."
                );

            }

        });

    }


    // ==================================================
    // 21. ACCESSIBILITY SETTINGS
    // ==================================================

    if (menuToggle) {

        menuToggle.setAttribute(
            "aria-controls",
            "sidebar"
        );

    }

    if (sidebar) {

        sidebar.setAttribute(
            "aria-label",
            "Main navigation"
        );

    }


    // ==================================================
    // 22. INITIAL DISPLAY
    // ==================================================

    refreshInventory();

    console.log("Printify Inventory initialized successfully.");

});