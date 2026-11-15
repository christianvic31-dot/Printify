/* =========================================================
   PRINTIFY CALAPAN
   STAFF MANAGEMENT JAVASCRIPT
   CRUD + SEARCH + FILTER + THEME
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    // =====================================================
    // 1. ELEMENTS
    // =====================================================

    const body = document.body;

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

    const addStaffButton = document.getElementById("addStaffButton");
    const searchInput = document.getElementById("searchInput");
    const positionFilter = document.getElementById("positionFilter");
    const statusFilter = document.getElementById("statusFilter");
    const resetFiltersButton = document.getElementById("resetFiltersButton");

    const staffTableBody = document.getElementById("staffTableBody");
    const resultsCount = document.getElementById("resultsCount");

    const staffFormModal = document.getElementById("staffFormModal");
    const staffForm = document.getElementById("staffForm");
    const staffFormTitle = document.getElementById("staffFormTitle");
    const staffFormSubtitle = document.getElementById("staffFormSubtitle");

    const editingStaffId = document.getElementById("editingStaffId");
    const staffName = document.getElementById("staffName");
    const staffUsername = document.getElementById("staffUsername");
    const staffPassword = document.getElementById("staffPassword");
    const staffPasswordLabel = document.getElementById("staffPasswordLabel");
    const staffPasswordRequired = document.getElementById("staffPasswordRequired");
    const staffEmail = document.getElementById("staffEmail");
    const staffPhone = document.getElementById("staffPhone");
    const staffPosition = document.getElementById("staffPosition");
    const staffAddress = document.getElementById("staffAddress");
    const staffStatus = document.getElementById("staffStatus");

    const closeStaffFormModal = document.getElementById("closeStaffFormModal");
    const cancelStaffForm = document.getElementById("cancelStaffForm");
    const saveStaffButton = document.getElementById("saveStaffButton");

    const viewStaffModal = document.getElementById("viewStaffModal");
    const staffDetailsContent = document.getElementById("staffDetailsContent");
    const closeViewStaffModal = document.getElementById("closeViewStaffModal");
    const closeViewStaffButton = document.getElementById("closeViewStaffButton");
    const printStaffQrButton = document.getElementById("printStaffQrButton");

    const deleteStaffModal = document.getElementById("deleteStaffModal");
    const deleteStaffName = document.getElementById("deleteStaffName");
    const cancelDeleteStaff = document.getElementById("cancelDeleteStaff");
    const confirmDeleteStaff = document.getElementById("confirmDeleteStaff");

    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");
    const toastText = document.getElementById("toastText");


    // =====================================================
    // 2. STORAGE
    // =====================================================

    const STAFF_STORAGE_KEY = "printifyStaff";
    const THEME_STORAGE_KEY = "printify-theme";
    const SIDEBAR_STORAGE_KEY = "printify-sidebar-hidden";

    let staffList = [];
    let staffToDelete = null;
    let viewedStaff = null;
    let toastTimer = null;

    const defaultStaff = [
        {
            id: "STF-001",
            name: "Juan Dela Cruz",
            email: "juan.delacruz@email.com",
            phone: "09171234567",
            position: "Manager",
            address: "Calapan City, Oriental Mindoro",
            dateAdded: "2026-01-05",
            status: "Active"
        },
        {
            id: "STF-002",
            name: "Maria Santos",
            email: "maria.santos@email.com",
            phone: "09181234567",
            position: "Cashier",
            address: "Calapan City, Oriental Mindoro",
            dateAdded: "2026-01-08",
            status: "Active"
        },
        {
            id: "STF-003",
            name: "Pedro Reyes",
            email: "pedro.reyes@email.com",
            phone: "09191234567",
            position: "Print Operator",
            address: "Naujan, Oriental Mindoro",
            dateAdded: "2026-01-12",
            status: "Active"
        },
        {
            id: "STF-004",
            name: "Ana Garcia",
            email: "ana.garcia@email.com",
            phone: "09201234567",
            position: "Graphic Designer",
            address: "Calapan City, Oriental Mindoro",
            dateAdded: "2026-01-15",
            status: "Inactive"
        },
        {
            id: "STF-005",
            name: "Mark Ramos",
            email: "mark.ramos@email.com",
            phone: "09211234567",
            position: "Production Staff",
            address: "Victoria, Oriental Mindoro",
            dateAdded: "2026-01-20",
            status: "Active"
        }
    ];


    // =====================================================
    // 3. STAFF STORAGE
    // =====================================================

    function loadStaff() {
        // Ang listahan ay galing sa server (ni-load ng auth-guard.js).
        try {
            const savedStaff = localStorage.getItem(STAFF_STORAGE_KEY);
            const parsedStaff = savedStaff ? JSON.parse(savedStaff) : [];
            staffList = Array.isArray(parsedStaff) ? parsedStaff : [];
        } catch (error) {
            console.error("Unable to load staff records:", error);
            staffList = [];
        }
    }

    // Kunin ulit ang pinakabagong staff at bilang ng orders mula sa server.
    function refreshStaffFromServer() {
        if (!window.PrintifyAPI) {
            return;
        }

        const items = window.PrintifyAPI.fetchStaff();

        if (items) {
            staffList = items;
        }
    }

    function saveStaff() {
        try {
            localStorage.setItem(
                STAFF_STORAGE_KEY,
                JSON.stringify(staffList)
            );
        } catch (error) {
            console.error("Unable to save staff records:", error);
            showToast("Unable to save staff data in this browser.", "error");
        }
    }


    // =====================================================
    // 4. DATE AND YEAR
    // =====================================================

    function updateDate() {
        if (currentDate) {
            const dateText = currentDate.querySelector("span");

            if (dateText) {
                dateText.textContent = new Date().toLocaleDateString("en-PH", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                });
            }
        }

        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }
    }


    // =====================================================
    // 5. LIGHT MODE / DARK MODE
    // =====================================================

    function applyTheme(theme) {
        const isDark = theme === "dark";

        body.classList.toggle("dark-mode", isDark);

        if (themeIcon) {
            themeIcon.src = isDark
                ? "image/lightmode_icon.png"
                : "image/nightmode_icon.png";

            themeIcon.alt = isDark
                ? "Switch to light mode"
                : "Switch to dark mode";
        }

        if (themeToggle) {
            themeToggle.setAttribute(
                "aria-label",
                isDark ? "Switch to light mode" : "Switch to dark mode"
            );
        }

        localStorage.setItem(THEME_STORAGE_KEY, theme);
    }

    function initializeTheme() {
        const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
        applyTheme(savedTheme === "dark" ? "dark" : "light");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", function () {
            const isDark = body.classList.contains("dark-mode");
            applyTheme(isDark ? "light" : "dark");
        });
    }


    // =====================================================
    // 6. SIDEBAR
    // =====================================================

    function closeSidebar() {
        body.classList.add("sidebar-hidden");

        if (sidebarOverlay) {
            sidebarOverlay.classList.remove("active");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "false");
        }

        localStorage.setItem(SIDEBAR_STORAGE_KEY, "true");
    }

    function openSidebar() {
        body.classList.remove("sidebar-hidden");

        if (sidebarOverlay) {
            sidebarOverlay.classList.add("active");
        }

        if (menuToggle) {
            menuToggle.setAttribute("aria-expanded", "true");
        }

        localStorage.setItem(SIDEBAR_STORAGE_KEY, "false");
    }

    function initializeSidebar() {
        const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);

        if (savedState === "true") {
            closeSidebar();
        } else if (savedState === "false") {
            openSidebar();
        }
    }

    if (menuToggle) {
        menuToggle.addEventListener("click", function () {
            if (body.classList.contains("sidebar-hidden")) {
                openSidebar();
            } else {
                closeSidebar();
            }
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener("click", closeSidebar);
    }


    // =====================================================
    // 7. PROFILE DROPDOWN
    // =====================================================

    if (profileButton && profileDropdown) {

        profileButton.addEventListener("click", function (event) {
            event.stopPropagation();

            const isOpen = profileDropdown.classList.toggle("active");

            profileButton.setAttribute("aria-expanded", String(isOpen));
        });

        document.addEventListener("click", function (event) {
            if (
                !profileButton.contains(event.target) &&
                !profileDropdown.contains(event.target)
            ) {
                profileDropdown.classList.remove("active");
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
            showToast("No new notifications.", "info");
        });
    }


    // =====================================================
    // 8. TOAST NOTIFICATION
    // =====================================================

    function showToast(message, type = "success") {
        if (!toastMessage || !toastText || !toastIcon) {
            return;
        }

        clearTimeout(toastTimer);

        toastText.textContent = message;

        toastIcon.className = type === "error"
            ? "fa-solid fa-circle-exclamation"
            : type === "info"
                ? "fa-solid fa-circle-info"
                : "fa-solid fa-circle-check";

        toastIcon.style.color = type === "error"
            ? "#e34444"
            : type === "info"
                ? "#3498db"
                : "#19bd35";

        toastMessage.classList.add("show");

        toastTimer = setTimeout(function () {
            toastMessage.classList.remove("show");
        }, 3000);
    }


    // =====================================================
    // 9. HELPER FUNCTIONS
    // =====================================================

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

    function getInitials(name) {
        return String(name || "")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(word => word.charAt(0).toUpperCase())
            .join("");
    }

    function formatDate(dateString) {
        if (!dateString) {
            return "—";
        }

        const date = new Date(dateString + "T00:00:00");

        if (Number.isNaN(date.getTime())) {
            return dateString;
        }

        return date.toLocaleDateString("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric"
        });
    }

    function generateStaffID() {
        let highestNumber = 0;

        staffList.forEach(function (staff) {
            const match = String(staff.id).match(/^STF-(\d+)$/);

            if (match) {
                highestNumber = Math.max(
                    highestNumber,
                    Number(match[1])
                );
            }
        });

        return "STF-" + String(highestNumber + 1).padStart(3, "0");
    }

    function getStaffById(id) {
        return staffList.find(staff => staff.id === id);
    }


    // =====================================================
    // 10. POSITION FILTER OPTIONS
    // =====================================================

    function updatePositionFilter() {
        if (!positionFilter) {
            return;
        }

        const selectedPosition = positionFilter.value || "all";

        const positions = [...new Set(
            staffList
                .map(staff => staff.position)
                .filter(Boolean)
        )].sort();

        positionFilter.innerHTML = `
            <option value="all">All Positions</option>
            ${positions.map(position => `
                <option value="${escapeHTML(position)}">
                    ${escapeHTML(position)}
                </option>
            `).join("")}
        `;

        positionFilter.value = positions.includes(selectedPosition)
            ? selectedPosition
            : "all";
    }


    // =====================================================
    // 11. SEARCH AND FILTER
    // =====================================================

    function getFilteredStaff() {
        const searchTerm = searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

        const selectedPosition = positionFilter
            ? positionFilter.value
            : "all";

        const selectedStatus = statusFilter
            ? statusFilter.value
            : "all";

        return staffList.filter(function (staff) {
            const matchesSearch =
                String(staff.name || "").toLowerCase().includes(searchTerm) ||
                String(staff.id || "").toLowerCase().includes(searchTerm) ||
                String(staff.email || "").toLowerCase().includes(searchTerm);

            const matchesPosition =
                selectedPosition === "all" ||
                staff.position === selectedPosition;

            const matchesStatus =
                selectedStatus === "all" ||
                staff.status === selectedStatus;

            return matchesSearch && matchesPosition && matchesStatus;
        });
    }


    // =====================================================
    // 12. RENDER STAFF TABLE
    // =====================================================

    function renderStaffTable() {
        if (!staffTableBody) {
            return;
        }

        const filteredStaff = getFilteredStaff();

        if (filteredStaff.length === 0) {
            staffTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="empty-state">
                        <i class="fa-solid fa-users"></i>
                        <strong>No staff members found</strong>
                        <span>Try changing your search or filter.</span>
                    </td>
                </tr>
            `;
        } else {
            staffTableBody.innerHTML = filteredStaff.map(function (staff) {
                const statusClass = staff.status === "Active"
                    ? "active"
                    : "inactive";

                const counts = staff.orders || {};

                return `
                    <tr>
                        <td>
                            <div class="staff-name-cell">
                                <div class="staff-avatar">
                                    ${escapeHTML(getInitials(staff.name))}
                                </div>

                                <div class="staff-name-information">
                                    <strong>${escapeHTML(staff.name)}</strong>
                                    <span>${escapeHTML(staff.email)}</span>
                                </div>
                            </div>
                        </td>

                        <td>
                            <span class="staff-id">
                                ${escapeHTML(staff.id)}
                            </span>
                        </td>

                        <td>${escapeHTML(staff.position)}</td>
                        <td>${escapeHTML(staff.phone)}</td>

                        <td>
                            <strong>${escapeHTML(counts.total || 0)}</strong> total<br>
                            <small>
                                ${escapeHTML(counts.pending || 0)} pending ·
                                ${escapeHTML(counts.inProgress || 0)} in progress ·
                                ${escapeHTML(counts.completed || 0)} done
                            </small>
                        </td>

                        <td>${escapeHTML(formatDate(staff.dateAdded))}</td>

                        <td>
                            <span class="staff-status ${statusClass}">
                                ${escapeHTML(staff.status)}
                            </span>
                        </td>

                        <td>
                            <div class="staff-actions">

                                <button type="button"
                                        class="action-button"
                                        data-action="view"
                                        data-id="${escapeHTML(staff.id)}"
                                        title="View Staff"
                                        aria-label="View Staff">
                                    <i class="fa-regular fa-eye"></i>
                                </button>

                                <button type="button"
                                        class="action-button"
                                        data-action="edit"
                                        data-id="${escapeHTML(staff.id)}"
                                        title="Edit Staff"
                                        aria-label="Edit Staff">
                                    <i class="fa-solid fa-pen"></i>
                                </button>

                                <button type="button"
                                        class="action-button delete"
                                        data-action="delete"
                                        data-id="${escapeHTML(staff.id)}"
                                        title="Delete Staff"
                                        aria-label="Delete Staff">
                                    <i class="fa-regular fa-trash-can"></i>
                                </button>

                            </div>
                        </td>
                    </tr>
                `;
            }).join("");
        }

        if (resultsCount) {
            resultsCount.textContent =
                `Showing ${filteredStaff.length} of ${staffList.length} staff members`;
        }

        updatePositionFilter();
    }


    // =====================================================
    // 13. MODAL HELPERS
    // =====================================================

    function showModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.add("active");
        modal.setAttribute("aria-hidden", "false");
        body.style.overflow = "hidden";
    }

    function hideModal(modal) {
        if (!modal) {
            return;
        }

        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");

        const anotherModalIsOpen = [
            staffFormModal,
            viewStaffModal,
            deleteStaffModal
        ].some(function (item) {
            return item &&
                item !== modal &&
                item.classList.contains("active");
        });

        if (!anotherModalIsOpen) {
            body.style.overflow = "";
        }
    }


    // =====================================================
    // 14. ADD STAFF MODAL
    // =====================================================

    function openStaffFormModal() {
        if (!staffFormModal || !staffForm) {
            return;
        }

        staffForm.reset();

        editingStaffId.value = "";
        staffStatus.value = "Active";

        if (staffUsername) {
            staffUsername.disabled = false;
            staffUsername.required = true;
        }

        if (staffPassword) {
            staffPassword.required = true;
        }

        if (staffPasswordLabel) {
            staffPasswordLabel.textContent = "Login Password";
        }

        if (staffPasswordRequired) {
            staffPasswordRequired.hidden = false;
        }

        staffFormTitle.textContent = "Add New Staff";
        staffFormSubtitle.textContent =
            "Enter the staff member's information below.";

        saveStaffButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Save Staff
        `;

        showModal(staffFormModal);

        setTimeout(function () {
            if (staffName) {
                staffName.focus();
            }
        }, 150);
    }

    function closeStaffForm() {
        hideModal(staffFormModal);

        if (staffForm) {
            staffForm.reset();
        }

        if (editingStaffId) {
            editingStaffId.value = "";
        }
    }

    if (addStaffButton) {
        addStaffButton.addEventListener("click", openStaffFormModal);
    }

    if (closeStaffFormModal) {
        closeStaffFormModal.addEventListener("click", closeStaffForm);
    }

    if (cancelStaffForm) {
        cancelStaffForm.addEventListener("click", closeStaffForm);
    }


    // =====================================================
    // 15. SAVE / UPDATE STAFF
    // =====================================================

    if (staffForm) {
        staffForm.addEventListener("submit", function (event) {
            event.preventDefault();

            const name = staffName.value.trim();
            const email = staffEmail.value.trim().toLowerCase();
            const phone = staffPhone.value.trim();
            const position = staffPosition.value;
            const address = staffAddress.value.trim();
            const status = staffStatus.value;

            const currentId = editingStaffId.value;

            if (!name || !email || !phone || !position) {
                showToast("Please complete all required fields.", "error");
                return;
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(email)) {
                showToast("Please enter a valid email address.", "error");
                staffEmail.focus();
                return;
            }

            const cleanedPhone = phone.replace(/[\s-]/g, "");

            if (!/^[0-9+()]{7,16}$/.test(cleanedPhone)) {
                showToast("Please enter a valid contact number.", "error");
                staffPhone.focus();
                return;
            }

            const duplicateEmail = staffList.some(function (staff) {
                return (
                    String(staff.email || "").toLowerCase() === email &&
                    staff.id !== currentId
                );
            });

            if (duplicateEmail) {
                showToast("This email address is already registered.", "error");
                staffEmail.focus();
                return;
            }

            // I-SAVE SA SERVER (PostgreSQL). Ang Admin ang gumagawa ng login ng Staff.

            const username = staffUsername ? staffUsername.value.trim() : "";
            const password = staffPassword ? staffPassword.value : "";

            if (!currentId && (!username || !password)) {
                showToast("Please set a username and password for the staff login.", "error");
                return;
            }

            const payload = {
                name,
                email,
                phone,
                position,
                address,
                status,
                username,
                password
            };

            let result;

            if (currentId) {
                const existing = getStaffById(currentId);

                if (!existing) {
                    showToast("Staff record could not be found.", "error");
                    return;
                }

                result = window.PrintifyAPI.request(
                    "PUT",
                    "/api/staff/" + existing.userId,
                    payload
                );
            } else {
                result = window.PrintifyAPI.request("POST", "/api/staff", payload);
            }

            if (result.status < 200 || result.status >= 300) {
                showToast(
                    (result.data && result.data.message) || "Unable to save the staff account.",
                    "error"
                );
                return;
            }

            refreshStaffFromServer();
            saveStaff();
            renderStaffTable();
            closeStaffForm();

            if (!currentId && result.data && result.data.id) {
                viewStaff(result.data.id);
                showToast("Staff account created. Print the QR code to give it to the staff member.");
            } else {
                showToast("Staff information updated successfully.");
            }
        });
    }


    // =====================================================
    // 16. EDIT STAFF
    // =====================================================

    function editStaff(id) {
        const staff = getStaffById(id);

        if (!staff) {
            showToast("Staff record not found.", "error");
            return;
        }

        if (!staffForm) {
            return;
        }

        staffForm.reset();

        editingStaffId.value = staff.id;

        staffName.value = staff.name || "";
        staffEmail.value = staff.email || "";
        staffPhone.value = staff.phone || "";
        staffPosition.value = staff.position || "";
        staffAddress.value = staff.address || "";
        staffStatus.value = staff.status || "Active";

        if (staffUsername) {
            staffUsername.value = staff.username || "";
            staffUsername.disabled = true;
            staffUsername.required = false;
        }

        if (staffPassword) {
            staffPassword.value = "";
            staffPassword.required = false;
        }

        if (staffPasswordLabel) {
            staffPasswordLabel.textContent = "New Password (optional)";
        }

        if (staffPasswordRequired) {
            staffPasswordRequired.hidden = true;
        }

        staffFormTitle.textContent = "Edit Staff Information";
        staffFormSubtitle.textContent =
            "Update the information of this staff member.";

        saveStaffButton.innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Update Staff
        `;

        showModal(staffFormModal);
    }


    // =====================================================
    // 17. VIEW STAFF
    // =====================================================

    function viewStaff(id) {
        const staff = getStaffById(id);

        if (!staff || !staffDetailsContent) {
            showToast("Staff record not found.", "error");
            return;
        }

        viewedStaff = staff;

        const statusClass = staff.status === "Active"
            ? "active"
            : "inactive";

        staffDetailsContent.innerHTML = `
            <div class="staff-details-profile">

                <div class="staff-details-avatar">
                    ${escapeHTML(getInitials(staff.name))}
                </div>

                <div>
                    <h3>${escapeHTML(staff.name)}</h3>
                    <p>${escapeHTML(staff.position)} · ${escapeHTML(staff.id)}</p>
                    <span class="staff-status ${statusClass}">
                        ${escapeHTML(staff.status)}
                    </span>
                </div>

            </div>

            <div class="staff-details-grid">

                <div class="staff-detail-item">
                    <span>Staff ID</span>
                    <strong>${escapeHTML(staff.id)}</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Position</span>
                    <strong>${escapeHTML(staff.position)}</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Login Username</span>
                    <strong>${escapeHTML(staff.username || "—")}</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Orders Received</span>
                    <strong>${escapeHTML((staff.orders && staff.orders.total) || 0)}
                        (${escapeHTML((staff.orders && staff.orders.completed) || 0)} completed)</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Email Address</span>
                    <strong>${escapeHTML(staff.email)}</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Contact Number</span>
                    <strong>${escapeHTML(staff.phone)}</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Date Added</span>
                    <strong>${escapeHTML(formatDate(staff.dateAdded))}</strong>
                </div>

                <div class="staff-detail-item">
                    <span>Account Status</span>
                    <strong>${escapeHTML(staff.status)}</strong>
                </div>

                <div class="staff-detail-item" style="grid-column: 1 / -1;">
                    <span>Address</span>
                    <strong>${escapeHTML(staff.address || "No address provided")}</strong>
                </div>

            </div>

            <section class="staff-attendance-qr-panel" aria-labelledby="staffDetailsQrHeading">
                <div>
                    <h3 id="staffDetailsQrHeading">Attendance QR Code</h3>
                    <p>The staff member must sign in on their phone before scanning this code to clock in.</p>
                </div>
                <div id="staffDetailsAttendanceQr" class="staff-attendance-qr-code"></div>
                <strong class="staff-attendance-qr-label">${escapeHTML(staff.id)}</strong>
            </section>
        `;

        window.PrintifyStaffQr.render(
            document.getElementById("staffDetailsAttendanceQr"),
            staff.id
        );
        showModal(viewStaffModal);
    }

    function printStaffQr(staff) {
        const qrContainer = document.getElementById("staffDetailsAttendanceQr");
        const qrCanvas = qrContainer && qrContainer.querySelector("canvas");
        const qrImage = qrContainer && qrContainer.querySelector("img");
        const qrSource = qrCanvas
            ? qrCanvas.toDataURL("image/png")
            : qrImage && qrImage.src;

        if (!qrSource) {
            showToast("The staff QR code is not ready to print.", "error");
            return;
        }

        const printWindow = window.open("", "_blank", "width=600,height=700");

        if (!printWindow) {
            showToast("Allow pop-ups to print the staff QR code.", "error");
            return;
        }

        printWindow.opener = null;
        printWindow.document.write(`
            <!doctype html>
            <html lang="en">
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Staff Attendance QR - ${escapeHTML(staff.name)}</title>
                <style>
                    @page { size: A5 portrait; margin: 16mm; }
                    body {
                        margin: 0;
                        color: #172117;
                        font-family: Arial, sans-serif;
                        text-align: center;
                    }
                    main {
                        display: grid;
                        justify-items: center;
                        gap: 12px;
                    }
                    h1 { margin: 0; font-size: 22px; }
                    p { margin: 0; font-size: 15px; }
                    img { width: 250px; height: 250px; image-rendering: pixelated; }
                    strong { font-size: 18px; letter-spacing: 2px; }
                </style>
            </head>
            <body>
                <main>
                    <h1>Printify Staff Attendance</h1>
                    <p>${escapeHTML(staff.name)}</p>
                    <img src="${qrSource}" alt="Attendance QR code for ${escapeHTML(staff.id)}">
                    <strong>${escapeHTML(staff.id)}</strong>
                </main>
                <script>
                    window.addEventListener("load", function () {
                        window.print();
                    });
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }

    if (printStaffQrButton) {
        printStaffQrButton.addEventListener("click", function () {
            if (!viewedStaff) {
                showToast("Select a staff member before printing a QR code.", "error");
                return;
            }

            printStaffQr(viewedStaff);
        });
    }

    function closeViewModal() {
        hideModal(viewStaffModal);
    }

    if (closeViewStaffModal) {
        closeViewStaffModal.addEventListener("click", closeViewModal);
    }

    if (closeViewStaffButton) {
        closeViewStaffButton.addEventListener("click", closeViewModal);
    }


    // =====================================================
    // 18. DELETE STAFF
    // =====================================================

    function openDeleteModal(id) {
        const staff = getStaffById(id);

        if (!staff) {
            showToast("Staff record not found.", "error");
            return;
        }

        staffToDelete = id;

        if (deleteStaffName) {
            deleteStaffName.textContent = staff.name;
        }

        showModal(deleteStaffModal);
    }

    function closeDeleteModal() {
        hideModal(deleteStaffModal);
        staffToDelete = null;
    }

    if (cancelDeleteStaff) {
        cancelDeleteStaff.addEventListener("click", closeDeleteModal);
    }

    if (confirmDeleteStaff) {
        confirmDeleteStaff.addEventListener("click", function () {
            if (!staffToDelete) {
                return;
            }

            const staff = getStaffById(staffToDelete);

            if (!staff) {
                closeDeleteModal();
                return;
            }

            const removed = window.PrintifyAPI.request(
                "DELETE",
                "/api/staff/" + staff.userId
            );

            if (removed.status < 200 || removed.status >= 300) {
                showToast(
                    (removed.data && removed.data.message) || "Unable to delete the staff account.",
                    "error"
                );
                closeDeleteModal();
                return;
            }

            refreshStaffFromServer();
            saveStaff();
            renderStaffTable();
            closeDeleteModal();

            showToast("Staff account deleted. Their orders are now unassigned.");
        });
    }


    // =====================================================
    // 19. TABLE ACTION EVENTS
    // =====================================================

    if (staffTableBody) {
        staffTableBody.addEventListener("click", function (event) {
            const button = event.target.closest("[data-action]");

            if (!button) {
                return;
            }

            const action = button.dataset.action;
            const id = button.dataset.id;

            if (action === "view") {
                viewStaff(id);
            }

            if (action === "edit") {
                editStaff(id);
            }

            if (action === "delete") {
                openDeleteModal(id);
            }
        });
    }


    // =====================================================
    // 20. SEARCH EVENTS
    // =====================================================

    if (searchInput) {
        searchInput.addEventListener("input", renderStaffTable);
    }

    if (positionFilter) {
        positionFilter.addEventListener("change", renderStaffTable);
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", renderStaffTable);
    }


    // =====================================================
    // 21. RESET FILTERS
    // =====================================================

    if (resetFiltersButton) {
        resetFiltersButton.addEventListener("click", function () {
            if (searchInput) {
                searchInput.value = "";
            }

            if (positionFilter) {
                positionFilter.value = "all";
            }

            if (statusFilter) {
                statusFilter.value = "all";
            }

            renderStaffTable();
            showToast("Filters have been reset.", "info");
        });
    }


    // =====================================================
    // 22. CLICK OUTSIDE TO CLOSE MODALS
    // =====================================================

    [staffFormModal, viewStaffModal, deleteStaffModal].forEach(function (modal) {
        if (!modal) {
            return;
        }

        modal.addEventListener("click", function (event) {
            if (event.target !== modal) {
                return;
            }

            if (modal === staffFormModal) {
                closeStaffForm();
            }

            if (modal === viewStaffModal) {
                closeViewModal();
            }

            if (modal === deleteStaffModal) {
                closeDeleteModal();
            }
        });
    });


    // =====================================================
    // 23. ESCAPE KEY
    // =====================================================

    document.addEventListener("keydown", function (event) {
        if (event.key !== "Escape") {
            return;
        }

        if (staffFormModal?.classList.contains("active")) {
            closeStaffForm();
        }

        if (viewStaffModal?.classList.contains("active")) {
            closeViewModal();
        }

        if (deleteStaffModal?.classList.contains("active")) {
            closeDeleteModal();
        }

        if (profileDropdown?.classList.contains("active")) {
            profileDropdown.classList.remove("active");
            profileButton?.setAttribute("aria-expanded", "false");
        }
    });


    // =====================================================
    // 24. INITIALIZE PAGE
    // =====================================================

    loadStaff();
    refreshStaffFromServer();
    updateDate();
    initializeTheme();
    initializeSidebar();
    updatePositionFilter();
    renderStaffTable();

    // I-update ang bilang ng orders kada staff habang nakabukas ang page.
    setInterval(function () {

        const modalOpen =
            staffFormModal?.classList.contains("active") ||
            viewStaffModal?.classList.contains("active") ||
            deleteStaffModal?.classList.contains("active");

        if (modalOpen || document.hidden) {
            return;
        }

        refreshStaffFromServer();
        renderStaffTable();

    }, 20000);

});