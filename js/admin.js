/**
 * VerifyMyWarranty / Foxzen - Comprehensive Admin Dashboard Logic
 * Features:
 * 1. Products Management (Add, Edit, Delete, Catalog table)
 * 2. User & Warranty Management (Add, Edit, Delete, Search)
 * 3. Product Dropdown with Auto-Fill in Add User modal
 * 4. Expiry Notifications (Today, In 2 Days, In 4 Days) with navbar badge
 * 5. Dedicated 1-Click WhatsApp & Telegram renewal reminders
 * 6. Post-save confirmation with pre-formatted message & Copy to Clipboard
 */

// Global State
let allWarranties = [];
let allProducts = [];
let allLeads = [];
let allDiaryNotes = [];
let parsedCSVRecords = [];
let currentNotifFilter = "all";
let currentDiaryFilter = "all";

// Modal Instances
let warrantyModalInstance = null;
let productModalInstance = null;
let postSaveModalInstance = null;
let notificationModalInstance = null;
let importModalInstance = null;
let leadMessageModalInstance = null;
let diaryNoteModalInstance = null;
let statDetailModalInstance = null;
let renewModalInstance = null;
let postRenewModalInstance = null;
let renewalsHistoryModalInstance = null;
let editRenewalModalInstance = null;
let allRenewals = [];
let currentStatModalType = "all";
let currentModalLeadId = null;

document.addEventListener("DOMContentLoaded", function () {
  // 1. Auth Guard
  checkAuth();

  // 2. Initialize Modals
  warrantyModalInstance = new bootstrap.Modal(document.getElementById("warrantyModal"));
  productModalInstance = new bootstrap.Modal(document.getElementById("productModal"));
  postSaveModalInstance = new bootstrap.Modal(document.getElementById("postSaveModal"));
  notificationModalInstance = new bootstrap.Modal(document.getElementById("notificationModal"));
  importModalInstance = new bootstrap.Modal(document.getElementById("importModal"));
  const leadMsgModalEl = document.getElementById("leadMessageModal");
  if (leadMsgModalEl) {
    leadMessageModalInstance = new bootstrap.Modal(leadMsgModalEl);
  }
  const diaryModalEl = document.getElementById("diaryNoteModal");
  if (diaryModalEl) {
    diaryNoteModalInstance = new bootstrap.Modal(diaryModalEl);
  }
  const statModalEl = document.getElementById("statDetailModal");
  if (statModalEl) {
    statDetailModalInstance = new bootstrap.Modal(statModalEl);
  }
  const renewModalEl = document.getElementById("renewLicenseModal");
  if (renewModalEl) {
    renewModalInstance = new bootstrap.Modal(renewModalEl);
  }
  const postRenewModalEl = document.getElementById("postRenewModal");
  if (postRenewModalEl) {
    postRenewModalInstance = new bootstrap.Modal(postRenewModalEl);
  }
  const renewalsHistoryModalEl = document.getElementById("renewalsHistoryModal");
  if (renewalsHistoryModalEl) {
    renewalsHistoryModalInstance = new bootstrap.Modal(renewalsHistoryModalEl);
  }
  const editRenewalModalEl = document.getElementById("editRenewalModal");
  if (editRenewalModalEl) {
    editRenewalModalInstance = new bootstrap.Modal(editRenewalModalEl);
  }

  // 3. Update Environment Indicator
  updateBackendBadge();

  // 4. Load Data
  loadProducts();
  loadWarranties();
  loadLeads();

  // 5. Attach Filter & Search Listeners
  document.getElementById("adminTableSearch").addEventListener("input", filterAndRenderTable);
  document.getElementById("statusFilter").addEventListener("change", filterAndRenderTable);
  document.getElementById("productSearchInput").addEventListener("input", filterAndRenderProducts);

  const leadsSearch = document.getElementById("leadsTableSearch");
  if (leadsSearch) leadsSearch.addEventListener("input", renderLeadsTable);
  const leadsFilter = document.getElementById("leadStatusFilter");
  if (leadsFilter) leadsFilter.addEventListener("change", renderLeadsTable);

  // 6. Attach Form Submission Listeners
  document.getElementById("warrantyForm").addEventListener("submit", handleWarrantyFormSubmit);
  document.getElementById("productForm").addEventListener("submit", handleProductFormSubmit);

  // 7. Attach CSV File Input Listener
  document.getElementById("csvFileInput").addEventListener("change", handleCSVFileSelection);

  // 8. Attach Stat Cards & Icons Listeners (Fallback to ensure clicks always work)
  const statBinds = [
    { id: "cardTotalUsers", type: "all" },
    { id: "cardActiveLicenses", type: "active" },
    { id: "cardExpiredLicenses", type: "expired" },
    { id: "cardExpiringLicenses", type: "expiring30" }
  ];
  statBinds.forEach(({ id, type }) => {
    const cardEl = document.getElementById(id);
    if (cardEl) {
      cardEl.addEventListener("click", () => {
        if (typeof window.openStatDetailModal === "function") {
          window.openStatDetailModal(type);
        }
      });
      const iconEl = cardEl.querySelector(".stat-icon");
      if (iconEl) {
        iconEl.addEventListener("click", (e) => {
          e.stopPropagation();
          if (typeof window.openStatDetailModal === "function") {
            window.openStatDetailModal(type);
          }
        });
      }
    }
  });
});

// ===========================================================================
// AUTHENTICATION & NAVIGATION
// ===========================================================================

function checkAuth() {
  const session =
    sessionStorage.getItem(CONFIG.ADMIN_SESSION_KEY) ||
    localStorage.getItem(CONFIG.ADMIN_SESSION_KEY);
  if (session !== "authenticated") {
    window.location.href = "login.html";
  }
}

window.logoutAdmin = function () {
  sessionStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
  localStorage.removeItem(CONFIG.ADMIN_SESSION_KEY);
  window.location.href = "login.html";
};

window.switchAdminTab = function (tab) {
  const usersSec = document.getElementById("viewUsersSection");
  const prodsSec = document.getElementById("viewProductsSection");
  const revSec = document.getElementById("viewRevenueSection");
  const leadsSec = document.getElementById("viewLeadsSection");
  const diarySec = document.getElementById("viewDiarySection");

  const tabUsersBtn = document.getElementById("tabUsersBtn");
  const tabProdsBtn = document.getElementById("tabProductsBtn");
  const tabRevBtn = document.getElementById("tabRevenueBtn");
  const tabLeadsBtn = document.getElementById("tabLeadsBtn");
  const tabDiaryBtn = document.getElementById("tabDiaryBtn");

  [usersSec, prodsSec, revSec, leadsSec, diarySec].forEach((el) => el && el.classList.add("d-none"));
  [tabUsersBtn, tabProdsBtn, tabRevBtn, tabLeadsBtn, tabDiaryBtn].forEach((btn) => btn && btn.classList.remove("active"));

  if (tab === "products") {
    prodsSec.classList.remove("d-none");
    tabProdsBtn.classList.add("active");
  } else if (tab === "revenue") {
    revSec.classList.remove("d-none");
    tabRevBtn.classList.add("active");
    if (typeof window.renderRevenueDashboard === "function") {
      window.renderRevenueDashboard();
    }
  } else if (tab === "leads") {
    leadsSec && leadsSec.classList.remove("d-none");
    tabLeadsBtn && tabLeadsBtn.classList.add("active");
    loadLeads();
  } else if (tab === "diary") {
    diarySec && diarySec.classList.remove("d-none");
    tabDiaryBtn && tabDiaryBtn.classList.add("active");
    loadDiaryNotes();
  } else {
    usersSec.classList.remove("d-none");
    tabUsersBtn.classList.add("active");
  }
};

function updateBackendBadge() {
  const badge = document.getElementById("adminEnvBadge");
  if (!badge) return;

  if (CONFIG.isConfigured()) {
    badge.className = "badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill";
    badge.innerHTML = '<i class="bi bi-cloud-check-fill me-1"></i> Supabase Live DB';
  } else {
    badge.className = "badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill";
    badge.innerHTML = '<i class="bi bi-database-fill me-1"></i> Demo Local DB';
  }
}

// ===========================================================================
// PRODUCTS CATALOG MANAGEMENT
// ===========================================================================

async function loadProducts() {
  const tbody = document.getElementById("productsTableBody");
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-success me-2"></div>Loading products...</td></tr>`;

  try {
    const { data } = await window.warrantyService.getAllProducts();
    allProducts = data || [];
    populateProductDropdown(allProducts);
    filterAndRenderProducts();
  } catch (err) {
    console.error("Error loading products:", err);
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load products.</td></tr>`;
  }
}

function populateProductDropdown(products) {
  const select = document.getElementById("formProductSelect");
  select.innerHTML = '<option value="">-- Choose from Product Catalog --</option>';

  products.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = p.name;
    opt.setAttribute("data-name", p.name);
    opt.setAttribute("data-warranty", p.default_warranty_months || 12);
    opt.setAttribute("data-validity", p.default_validity_months || 12);
    const prodAmount = (p.default_amount !== undefined && p.default_amount !== null && p.default_amount !== "") ? p.default_amount : (p.amount !== undefined && p.amount !== null && p.amount !== "") ? p.amount : 0;
    opt.setAttribute("data-amount", prodAmount);
    select.appendChild(opt);
  });

  // Custom option
  const customOpt = document.createElement("option");
  customOpt.value = "custom";
  customOpt.textContent = "+ Custom / Other Product";
  select.appendChild(customOpt);
}

window.onProductSelectChange = function () {
  const select = document.getElementById("formProductSelect");
  const selectedOpt = select.options[select.selectedIndex];
  if (!selectedOpt || !selectedOpt.value) return;

  if (selectedOpt.value === "custom") {
    document.getElementById("formProductName").value = "";
    document.getElementById("formProductName").focus();
    return;
  }

  const name = selectedOpt.getAttribute("data-name");
  const warranty = selectedOpt.getAttribute("data-warranty");
  const validity = selectedOpt.getAttribute("data-validity");
  const type = selectedOpt.getAttribute("data-type");
  const amount = selectedOpt.getAttribute("data-amount");

  if (name) document.getElementById("formProductName").value = name;
  if (warranty) document.getElementById("formWarrantyMonths").value = warranty;
  if (validity) document.getElementById("formValidityMonths").value = validity;
  if (type) document.getElementById("formDurationType").value = type;

  const currentAmt = document.getElementById("formAmount").value.trim();
  const prodAmt = parseFloat(amount);
  if (!isNaN(prodAmt) && prodAmt > 0) {
    // If product has a positive catalog price, prefill it if user hasn't set custom price
    if (!currentAmt || parseFloat(currentAmt) === 0) {
      document.getElementById("formAmount").value = prodAmt;
    }
  } else if (!currentAmt) {
    document.getElementById("formAmount").value = "";
  }
  if (typeof window.updateProfitPreview === "function") {
    window.updateProfitPreview();
  }
};

window.filterProductDropdownOptions = function (query) {
  const q = (query || "").toLowerCase().trim();
  const select = document.getElementById("formProductSelect");
  const options = select.querySelectorAll("option");

  let matchCount = 0;
  let firstMatch = null;

  options.forEach((opt) => {
    if (!opt.value) {
      opt.style.display = "";
      return;
    }
    if (opt.value === "custom") {
      opt.style.display = "";
      return;
    }
    const text = opt.textContent.toLowerCase();
    if (text.includes(q)) {
      opt.style.display = "";
      matchCount++;
      if (!firstMatch) firstMatch = opt;
    } else {
      opt.style.display = "none";
    }
  });

  // If exact match or only one match when user typed something, select it
  if (q && matchCount === 1 && firstMatch) {
    select.value = firstMatch.value;
    window.onProductSelectChange();
  }
};

function filterAndRenderProducts() {
  const query = document.getElementById("productSearchInput").value.toLowerCase().trim();
  const tbody = document.getElementById("productsTableBody");
  const emptyState = document.getElementById("emptyProductState");
  const countBadge = document.getElementById("productsCountBadge");

  const filtered = allProducts.filter((p) => {
    if (!query) return true;
    return (
      (p.name || "").toLowerCase().includes(query) ||
      (p.description || "").toLowerCase().includes(query)
    );
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} of ${allProducts.length} Products`;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");
  let html = "";
  filtered.forEach((p) => {
    html += `
      <tr>
        <td class="fw-bold text-dark">
          <i class="bi bi-box-seam me-2 text-primary"></i>${escapeHtml(p.name)}
        </td>
        <td>
          <span class="badge bg-light text-dark border">
            ${p.default_warranty_months || 12} ${p.duration_type || "months"}
          </span>
        </td>
        <td>
          <span class="badge bg-light text-dark border">
            ${p.default_validity_months || 12} ${p.duration_type || "months"}
          </span>
        </td>
        <td>
          <span class="fw-bold text-dark">
            ${((p.default_amount !== undefined && p.default_amount !== null && p.default_amount !== "") || (p.amount !== undefined && p.amount !== null && p.amount !== "")) ? `₹${parseFloat(p.default_amount ?? p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `<span class="text-muted fw-normal">₹0.00</span>`}
          </span>
        </td>
        <td><small class="text-muted">${escapeHtml(p.description || "N/A")}</small></td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" title="Edit" onclick="openEditProductModal('${p.id}')">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" title="Delete" onclick="deleteProductRecord('${p.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

window.openAddProductModal = function () {
  document.getElementById("productModalTitle").textContent = "Add New Product";
  document.getElementById("editProductId").value = "";
  document.getElementById("productForm").reset();
  document.getElementById("productFormWarranty").value = "12";
  document.getElementById("productFormValidity").value = "12";
  document.getElementById("productFormDurationType").value = "month";
  document.getElementById("productFormAmount").value = "";
  productModalInstance.show();
};

window.openEditProductModal = function (id) {
  const p = allProducts.find((item) => item.id === id);
  if (!p) return;

  document.getElementById("productModalTitle").textContent = "Edit Product";
  document.getElementById("editProductId").value = p.id;
  document.getElementById("productFormName").value = p.name || "";
  document.getElementById("productFormWarranty").value = p.default_warranty_months || 12;
  document.getElementById("productFormValidity").value = p.default_validity_months || 12;
  document.getElementById("productFormDurationType").value = p.duration_type || "month";
  const existingAmt = (p.default_amount !== undefined && p.default_amount !== null) ? p.default_amount : (p.amount !== undefined && p.amount !== null) ? p.amount : "";
  document.getElementById("productFormAmount").value = existingAmt;
  document.getElementById("productFormDescription").value = p.description || "";
  productModalInstance.show();
};

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("editProductId").value;
  const saveBtn = document.getElementById("saveProductBtn");

  const rawAmt = document.getElementById("productFormAmount").value.trim();
  const amtVal = rawAmt !== "" ? parseFloat(rawAmt) : 0;

  const productData = {
    name: document.getElementById("productFormName").value.trim(),
    default_warranty_months: parseInt(document.getElementById("productFormWarranty").value, 10),
    default_validity_months: parseInt(document.getElementById("productFormValidity").value, 10),
    default_amount: isNaN(amtVal) ? 0 : amtVal,
    amount: isNaN(amtVal) ? 0 : amtVal,
    duration_type: document.getElementById("productFormDurationType").value,
    description: document.getElementById("productFormDescription").value.trim()
  };

  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

  try {
    let res;
    if (id) {
      res = await window.warrantyService.updateProduct(id, productData);
    } else {
      res = await window.warrantyService.createProduct(productData);
    }

    if (res && res.error) {
      throw res.error;
    }

    productModalInstance.hide();
    await loadProducts();
  } catch (err) {
    console.error("Product save error:", err);
    alert("Error saving product: " + (err.message || err.details || "Please check database connection."));
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Product`;
  }
}

window.deleteProductRecord = async function (id) {
  const p = allProducts.find((item) => item.id === id);
  if (!p) return;

  if (!confirm(`Are you sure you want to delete product "${p.name}"?`)) {
    return;
  }

  try {
    await window.warrantyService.deleteProduct(id);
    await loadProducts();
  } catch (err) {
    console.error("Delete product error:", err);
    alert("Failed to delete product: " + err.message);
  }
};

// ===========================================================================
// USERS & LICENSES MANAGEMENT
// ===========================================================================

async function loadWarranties() {
  const tbody = document.getElementById("warrantiesTableBody");
  tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Fetching user records...</td></tr>`;

  try {
    const { data } = await window.warrantyService.getAllWarranties();
    allWarranties = data || [];

    if (typeof window.warrantyService.getAllRenewals === "function") {
      try {
        const renRes = await window.warrantyService.getAllRenewals();
        allRenewals = renRes.data || [];
      } catch (e) {
        console.warn("Could not load renewals:", e);
        allRenewals = [];
      }
    }

    updateStatistics(allWarranties);
    updateNotificationsBadge(allWarranties);
    filterAndRenderTable();
    if (typeof window.renderRevenueDashboard === "function") {
      window.renderRevenueDashboard();
    }
  } catch (err) {
    console.error("Load warranties error:", err);
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-danger">Unexpected error loading records.</td></tr>`;
  }
}

function updateStatistics(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let total = records.length;
  let active = 0;
  let expired = 0;
  let expiring30Days = 0;

  records.forEach((r) => {
    const pDate = new Date(r.purchase_date);
    const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const isWActive = today <= expiry && r.status !== "void" && r.status !== "expired";
    const isWExpired = today > expiry || r.status === "expired";

    if (r.status === "void") {
      // void
    } else if (isWActive) {
      active++;
      if (diffDays <= 30 && diffDays >= 0) {
        expiring30Days++;
      }
    } else if (isWExpired) {
      expired++;
    }
  });

  const elTotal = document.getElementById("statTotal");
  if (elTotal) elTotal.textContent = total;
  const elActive = document.getElementById("statActive");
  if (elActive) elActive.textContent = active;
  const elExpired = document.getElementById("statExpired");
  if (elExpired) elExpired.textContent = expired;
  const elExpiring = document.getElementById("statExpiring");
  if (elExpiring) elExpiring.textContent = expiring30Days;

  // Sync Quick View modal pills count if present
  const pAll = document.getElementById("statPillCountAll");
  if (pAll) pAll.textContent = total;
  const pActive = document.getElementById("statPillCountActive");
  if (pActive) pActive.textContent = active;
  const pExpired = document.getElementById("statPillCountExpired");
  if (pExpired) pExpired.textContent = expired;
  const pExpiring = document.getElementById("statPillCountExpiring");
  if (pExpiring) pExpiring.textContent = expiring30Days;
}

// ===========================================================================
// NOTIFICATION SYSTEM (Today, 2 Days, 4 Days)
// ===========================================================================

function getExpiryBuckets(records) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = {
    today: [],
    in2Days: [],
    in4Days: [],
    allExpired: []
  };

  records.forEach((r) => {
    if (r.status === "void") return;

    const pDate = new Date(r.purchase_date);
    const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);

    const diffDays = Math.round((expiry - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      buckets.today.push({ record: r, expiry, diffDays });
    } else if (diffDays > 0 && diffDays <= 2) {
      buckets.in2Days.push({ record: r, expiry, diffDays });
    } else if (diffDays > 2 && diffDays <= 4) {
      buckets.in4Days.push({ record: r, expiry, diffDays });
    } else if (diffDays < 0) {
      buckets.allExpired.push({ record: r, expiry, diffDays });
    }
  });

  return buckets;
}

function updateNotificationsBadge(records) {
  const buckets = getExpiryBuckets(records);
  const urgentCount = buckets.today.length + buckets.in2Days.length + buckets.in4Days.length;

  const badge = document.getElementById("notificationBadge");
  badge.textContent = urgentCount;
  badge.style.display = urgentCount > 0 ? "inline-block" : "none";

  document.getElementById("notifCountAll").textContent = urgentCount + buckets.allExpired.length;
  document.getElementById("notifCountToday").textContent = buckets.today.length;
  document.getElementById("notifCount2Days").textContent = buckets.in2Days.length;
  document.getElementById("notifCount4Days").textContent = buckets.in4Days.length;
}

window.openNotificationModal = function () {
  filterNotifications(currentNotifFilter || "all");
  notificationModalInstance.show();
};

window.filterNotifications = function (filterType) {
  currentNotifFilter = filterType;
  const pills = document.querySelectorAll("#notificationPills .nav-link");
  pills.forEach((p) => p.classList.remove("active"));

  const buckets = getExpiryBuckets(allWarranties);
  let itemsToRender = [];

  if (filterType === "today") {
    itemsToRender = buckets.today;
  } else if (filterType === "2days") {
    itemsToRender = buckets.in2Days;
  } else if (filterType === "4days") {
    itemsToRender = buckets.in4Days;
  } else {
    // all
    itemsToRender = [...buckets.today, ...buckets.in2Days, ...buckets.in4Days, ...buckets.allExpired];
  }

  const container = document.getElementById("notificationListContainer");
  if (itemsToRender.length === 0) {
    container.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-bell-slash fs-1 d-block mb-2 text-secondary"></i>
        <h6 class="fw-bold">No Expiry Alerts</h6>
        <p class="small mb-0">No users match this notification category.</p>
      </div>
    `;
    return;
  }

  let html = "";
  itemsToRender.forEach((item) => {
    const r = item.record;
    let badgeClass = "bg-warning-subtle text-warning border-warning";
    let badgeText = `Expiring in ${item.diffDays} days`;

    if (item.diffDays === 0) {
      badgeClass = "bg-danger text-white";
      badgeText = "EXPIRES TODAY!";
    } else if (item.diffDays < 0) {
      badgeClass = "bg-danger-subtle text-danger border-danger";
      badgeText = `Expired ${Math.abs(item.diffDays)} days ago`;
    }

    const waLink = generateWhatsAppUrl(r);
    const tgLink = generateTelegramUrl(r);

    html += `
      <div class="card border rounded-3 p-3 mb-2 shadow-sm bg-white">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h6 class="fw-bold mb-0 text-dark">${escapeHtml(r.customer_name)}</h6>
            <small class="text-muted font-monospace">${escapeHtml(r.customer_mobile)}</small>
          </div>
          <span class="badge ${badgeClass} px-2 py-1">${badgeText}</span>
        </div>
        <div class="row g-2 small text-secondary mb-3">
          <div class="col-sm-6">
            <i class="bi bi-box-seam me-1"></i> ${escapeHtml(r.product_name)}
          </div>
          <div class="col-sm-6 font-monospace">
            <i class="bi bi-upc me-1"></i> ${escapeHtml(r.serial_number)}
          </div>
        </div>
        <div class="d-flex gap-2">
          <a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm rounded-pill px-3">
            <i class="bi bi-whatsapp"></i> Send WhatsApp Reminder
          </a>
          <a href="${tgLink}" target="_blank" class="btn btn-telegram btn-sm rounded-pill px-3">
            <i class="bi bi-telegram"></i> Telegram
          </a>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
};

// ===========================================================================
// WHATSAPP & TELEGRAM RENEWAL LINKS
// ===========================================================================

function generateWhatsAppUrl(record) {
  const rawPhone = String(record?.customer_mobile || "").trim();
  if (!rawPhone) {
    return "#";
  }

  const pDate = new Date(record.purchase_date);
  const expiry = calculateExpiry(pDate, record.warranty_months, record.warranty_type || "month");
  const expiryFormatted = formatDate(expiry);
  const actFormatted = formatDate(pDate);

  let phone = rawPhone.replace(/[^0-9]/g, "");

  if (phone.length === 10) {
    phone = "91" + phone;
  }

  const greeting = (record.customer_name && record.customer_name !== "Customer")
    ? `Hello ${record.customer_name},`
    : `Hello,`;

  const custEmail = String(record?.customer_email || "").trim();
  const emailLine = custEmail ? `Customer Email : ${custEmail}\n` : "";

  const message = 
`${greeting}

Your service license for *${record.product_name || "Service"}* is expiring on *${expiryFormatted}*.

Product Name : ${record.product_name || "N/A"}
${emailLine}activation date : ${actFormatted}
Valid till date : ${expiryFormatted}
Serial Number : ${record.serial_number || "N/A"}
Notes : ${record.notes || "Renewal reminder"}

Please renew your service to continue uninterrupted access.
thanks for choose Foxzen`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

function generateTelegramUrl(record) {
  if (!record) return "#";
  const pDate = new Date(record.purchase_date);
  const expiry = calculateExpiry(pDate, record.warranty_months, record.warranty_type || "month");
  const expiryFormatted = formatDate(expiry);
  const actFormatted = formatDate(pDate);

  const greeting = (record.customer_name && record.customer_name !== "Customer")
    ? `Hello ${record.customer_name},`
    : `Hello,`;

  const custEmail = String(record?.customer_email || "").trim();
  const emailLine = custEmail ? `Customer Email : ${custEmail}\n` : "";

  const message = 
`${greeting}

Your license for ${record.product_name || "Service"} is expiring on ${expiryFormatted}.

Product Name : ${record.product_name || "N/A"}
${emailLine}Activation: ${actFormatted}
Valid Till: ${expiryFormatted}
Serial: ${record.serial_number || "N/A"}

Please renew your service to continue uninterrupted access.
thanks for choose Foxzen`;

  const cleanUser = String(record.telegram_id || "").replace(/^@/, "").trim();
  if (cleanUser) {
    return `https://t.me/${cleanUser}`;
  }

  return `https://t.me/share/url?url=&text=${encodeURIComponent(message)}`;
}

// ===========================================================================
// STAT CARDS QUICK-VIEW MODAL (TOTAL, ACTIVE, EXPIRED, EXPIRING IN 30 DAYS)
// ===========================================================================

window.openStatDetailModal = function (type) {
  try {
    currentStatModalType = type || "all";
    const modalEl = document.getElementById("statDetailModal");
    if (!modalEl) {
      console.error("statDetailModal not found in DOM");
      return;
    }

    if (typeof bootstrap !== "undefined" && bootstrap.Modal) {
      statDetailModalInstance = bootstrap.Modal.getOrCreateInstance(modalEl);
      if (!statDetailModalInstance) {
        statDetailModalInstance = new bootstrap.Modal(modalEl);
      }
    }

    const searchInput = document.getElementById("statModalSearchInput");
    if (searchInput) searchInput.value = "";

    try {
      updateStatModalPills();
    } catch (e) {
      console.warn("updateStatModalPills error:", e);
    }

    try {
      renderStatModalContent();
    } catch (e) {
      console.error("renderStatModalContent error:", e);
    }

    if (statDetailModalInstance) {
      statDetailModalInstance.show();
    }
  } catch (err) {
    console.error("openStatDetailModal error:", err);
  }
};

window.switchStatModalCategory = function (type) {
  currentStatModalType = type;
  const searchInput = document.getElementById("statModalSearchInput");
  if (searchInput) searchInput.value = "";
  try {
    updateStatModalPills();
    renderStatModalContent();
  } catch (e) {
    console.error("switchStatModalCategory error:", e);
  }
};

function updateStatModalPills() {
  const pillMap = {
    all: "statPillAll",
    active: "statPillActive",
    expired: "statPillExpired",
    expiring30: "statPillExpiring"
  };
  Object.values(pillMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });
  const activePill = document.getElementById(pillMap[currentStatModalType]);
  if (activePill) activePill.classList.add("active");
}

window.filterStatModalList = function () {
  renderStatModalContent();
};

function getFilteredRecordsForStat(type) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return allWarranties.filter((r) => {
    const pDate = new Date(r.purchase_date);
    const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);
    const isDateValid = !isNaN(expiry.getTime());
    const diffDays = isDateValid ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : 999;
    const isWActive = isDateValid ? (today <= expiry && r.status !== "void" && r.status !== "expired") : (r.status === "active");
    const isWExpired = isDateValid ? (today > expiry || r.status === "expired") : (r.status === "expired");

    if (type === "active") {
      return isWActive;
    } else if (type === "expired") {
      return isWExpired;
    } else if (type === "expiring30") {
      return isDateValid && diffDays <= 30 && diffDays >= 0 && r.status !== "void" && r.status !== "expired";
    }
    return true; // "all"
  });
}

function renderStatModalContent() {
  const container = document.getElementById("statModalListContainer");
  const emptyState = document.getElementById("statModalEmptyState");
  const titleEl = document.getElementById("statModalTitle");
  const subEl = document.getElementById("statModalSubtitle");
  const iconEl = document.getElementById("statModalIcon");
  const iconBox = document.getElementById("statModalIconBox");
  const countBadge = document.getElementById("statModalCountBadge");
  const filterBtn = document.getElementById("statModalFilterTableBtn");
  const searchInput = document.getElementById("statModalSearchInput");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  if (!container) return;

  const typeConfig = {
    all: {
      title: "Total Users & Licenses",
      subtitle: "All registered customer licenses in Foxzen",
      icon: "bi-people",
      boxClass: "bg-primary bg-opacity-10 text-primary",
      badgeClass: "bg-primary text-white",
      btnText: "Filter Main Table (All Users)"
    },
    active: {
      title: "Active Licenses",
      subtitle: "Currently valid & running customer licenses",
      icon: "bi-patch-check",
      boxClass: "bg-success bg-opacity-10 text-success",
      badgeClass: "bg-success text-white",
      btnText: "Filter Main Table (Active Only)"
    },
    expired: {
      title: "Expired Licenses",
      subtitle: "Past validity date - renewal required",
      icon: "bi-x-circle",
      boxClass: "bg-danger bg-opacity-10 text-danger",
      badgeClass: "bg-danger text-white",
      btnText: "Filter Main Table (Expired Only)"
    },
    expiring30: {
      title: "Expiring in 30 Days",
      subtitle: "Urgent: Licenses due for renewal within next 30 days",
      icon: "bi-clock-history",
      boxClass: "bg-warning bg-opacity-10 text-warning",
      badgeClass: "bg-warning text-dark",
      btnText: "Filter Main Table (Expiring Soon)"
    }
  };

  const cfg = typeConfig[currentStatModalType] || typeConfig.all;
  if (titleEl) titleEl.textContent = cfg.title;
  if (subEl) subEl.textContent = cfg.subtitle;
  if (iconEl) iconEl.className = `bi ${cfg.icon}`;
  if (iconBox) iconBox.className = `stat-icon ${cfg.boxClass}`;
  if (filterBtn) filterBtn.innerHTML = `<i class="bi bi-funnel-fill me-1"></i> ${cfg.btnText}`;

  const baseRecords = getFilteredRecordsForStat(currentStatModalType);

  const items = baseRecords.filter((r) => {
    if (!query) return true;
    const matchProduct = (r.product_name || "").toLowerCase().includes(query);
    const matchSerial = (r.serial_number || "").toLowerCase().includes(query);
    const matchName = (r.customer_name || "").toLowerCase().includes(query);
    const matchEmail = (r.customer_email || "").toLowerCase().includes(query);
    const matchMobile = String(r.customer_mobile || "").toLowerCase().includes(query);
    return matchProduct || matchSerial || matchName || matchEmail || matchMobile;
  });

  if (countBadge) {
    countBadge.className = `badge rounded-pill px-3 py-2 ${cfg.badgeClass}`;
    countBadge.textContent = `${items.length} records`;
  }

  if (items.length === 0) {
    container.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = "";
  items.forEach((r) => {
    try {
      const pDate = new Date(r.purchase_date);
      const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
      expiry.setHours(0, 0, 0, 0);
      const isDateValid = !isNaN(expiry.getTime());
      const diffDays = isDateValid ? Math.ceil((expiry - today) / (1000 * 60 * 60 * 24)) : 999;

      let badgeClass = "bg-success-subtle text-success border border-success-subtle";
      let badgeText = isDateValid ? `Active (${diffDays} days left)` : "Active";

      if (r.status === "void") {
        badgeClass = "bg-secondary-subtle text-secondary border";
        badgeText = "Void / Suspended";
      } else if (!isDateValid) {
        badgeClass = "bg-secondary-subtle text-secondary border";
        badgeText = "Active (Lifetime / Custom)";
      } else if (diffDays === 0) {
        badgeClass = "bg-danger text-white";
        badgeText = "EXPIRES TODAY!";
      } else if (diffDays < 0) {
        badgeClass = "bg-danger-subtle text-danger border border-danger-subtle";
        badgeText = `Expired ${Math.abs(diffDays)} days ago`;
      } else if (diffDays <= 30) {
        badgeClass = "bg-warning-subtle text-warning-emphasis border border-warning-subtle";
        badgeText = `Expiring in ${diffDays} days`;
      }

      const waLink = generateWhatsAppUrl(r);
      const tgLink = generateTelegramUrl(r);
      const amountVal = (r.amount !== undefined && r.amount !== null && r.amount !== "") ? parseFloat(r.amount) : 0;
      const costVal = parseFloat(r.cost_price || 0);

      html += `
        <div class="card border rounded-3 p-3 bg-white shadow-sm mb-1">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div>
              <h6 class="fw-bold mb-0 text-dark">${escapeHtml(r.customer_name || "Customer")}</h6>
              <div class="small text-muted d-flex flex-wrap align-items-center gap-2 mt-1">
                ${r.customer_mobile ? `<span><i class="bi bi-phone me-1"></i>${escapeHtml(String(r.customer_mobile))}</span>` : ""}
                ${r.customer_email ? `<span><i class="bi bi-envelope me-1"></i>${escapeHtml(String(r.customer_email))}</span>` : ""}
                ${r.telegram_id ? `<span class="text-info"><i class="bi bi-telegram me-1"></i>@${escapeHtml(String(r.telegram_id).replace(/^@/, ""))}</span>` : ""}
              </div>
            </div>
            <span class="badge ${badgeClass} px-2 py-1">${badgeText}</span>
          </div>

          <div class="row g-2 small text-secondary bg-light p-2 rounded-2 mb-2">
            <div class="col-sm-6">
              <span class="text-dark fw-semibold"><i class="bi bi-box-seam text-primary me-1"></i>${escapeHtml(r.product_name)}</span>
              <div class="font-monospace text-muted mt-1"><i class="bi bi-upc me-1"></i>${escapeHtml(r.serial_number)}</div>
            </div>
            <div class="col-sm-6">
              <div><i class="bi bi-calendar-event me-1"></i>Valid Till: <strong>${formatDate(expiry)}</strong></div>
              <div class="mt-1 d-flex align-items-center gap-2">
                <span class="text-success fw-bold">₹${amountVal.toFixed(2)}</span>
                ${costVal > 0 ? `<span class="badge bg-warning-subtle text-warning-emphasis border">Cost: ₹${costVal.toFixed(0)}</span>` : `<span class="badge bg-light text-muted border">In-House</span>`}
                ${r.vendor_name ? `<span class="badge bg-secondary-subtle text-secondary">${escapeHtml(r.vendor_name)}</span>` : ""}
              </div>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <div class="d-flex gap-2">
              <a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm rounded-pill px-3">
                <i class="bi bi-whatsapp"></i> WhatsApp
              </a>
              ${r.telegram_id ? `
                <a href="${tgLink}" target="_blank" class="btn btn-telegram btn-sm rounded-pill px-3">
                  <i class="bi bi-telegram"></i> Telegram
                </a>
              ` : ""}
            </div>
            <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3" onclick="statModalEditUser('${r.id}')">
              <i class="bi bi-pencil me-1"></i> Edit License
            </button>
          </div>
        </div>
      `;
    } catch (err) {
      console.warn("Item render error in stat modal:", err, r);
    }
  });

  container.innerHTML = html;
}

window.statModalEditUser = function (id) {
  if (statDetailModalInstance) statDetailModalInstance.hide();
  openEditModal(id);
};

window.applyStatFilterToTable = function () {
  if (statDetailModalInstance) statDetailModalInstance.hide();
  const select = document.getElementById("statusFilter");
  if (select) {
    select.value = currentStatModalType;
  }
  filterAndRenderTable();
  const tableEl = document.getElementById("warrantiesTable");
  if (tableEl) {
    tableEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

window.clearTableStatusFilter = function () {
  const select = document.getElementById("statusFilter");
  if (select) select.value = "all";
  filterAndRenderTable();
};

// ===========================================================================
// USERS TABLE RENDERING & ACTIONS
// ===========================================================================

function filterAndRenderTable() {
  const query = document.getElementById("adminTableSearch").value.toLowerCase().trim();
  const statusFilter = document.getElementById("statusFilter").value;
  const tbody = document.getElementById("warrantiesTableBody");
  const emptyState = document.getElementById("emptyTableState");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const filtered = allWarranties.filter((item) => {
    const pDate = new Date(item.purchase_date);
    const expiry = calculateExpiry(pDate, item.warranty_months, item.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    const isWActive = today <= expiry && item.status !== "void" && item.status !== "expired";
    const isWExpired = today > expiry || item.status === "expired";

    if (statusFilter === "active") {
      if (!isWActive) return false;
    } else if (statusFilter === "expired") {
      if (!isWExpired) return false;
    } else if (statusFilter === "void") {
      if (item.status !== "void") return false;
    } else if (statusFilter === "expiring30") {
      if (!(diffDays <= 30 && diffDays >= 0 && item.status !== "void" && item.status !== "expired")) return false;
    }

    if (query) {
      const matchProduct = (item.product_name || "").toLowerCase().includes(query);
      const matchSerial = (item.serial_number || "").toLowerCase().includes(query);
      const matchName = (item.customer_name || "").toLowerCase().includes(query);
      const matchEmail = (item.customer_email || "").toLowerCase().includes(query);
      const matchMobile = (item.customer_mobile || "").toLowerCase().includes(query);
      return matchProduct || matchSerial || matchName || matchEmail || matchMobile;
    }

    return true;
  });

  // Active filter badge banner
  const badgeContainer = document.getElementById("activeFilterBadgeContainer");
  const badgeText = document.getElementById("activeFilterBadgeText");
  if (badgeContainer && badgeText) {
    if (statusFilter !== "all") {
      const labelMap = {
        active: "Active Licenses",
        expired: "Expired Licenses",
        expiring30: "Expiring in 30 Days",
        void: "Void / Suspended"
      };
      badgeText.innerHTML = `Filter: <strong>${labelMap[statusFilter] || statusFilter}</strong> (${filtered.length} users)`;
      badgeContainer.classList.remove("d-none");
    } else {
      badgeContainer.classList.add("d-none");
    }
  }

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    emptyState.classList.remove("d-none");
    return;
  }

  emptyState.classList.add("d-none");
  let html = "";

  filtered.forEach((r) => {
    const pDate = new Date(r.purchase_date);
    const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);
    const isWActive = today <= expiry && r.status !== "void";

    let badgeClass = "badge-status-active";
    let statusLabel = "Active";
    if (r.status === "void") {
      badgeClass = "badge-status-void";
      statusLabel = "Void";
    } else if (!isWActive) {
      badgeClass = "badge-status-expired";
      statusLabel = "Expired";
    }

    const waLink = generateWhatsAppUrl(r);
    const tgLink = generateTelegramUrl(r);

    html += `
      <tr>
        <td>
          <div class="fw-bold text-dark">${escapeHtml(r.product_name)}</div>
          <small class="badge bg-light text-secondary border font-monospace mt-1">
            <i class="bi bi-upc-scan me-1"></i>${escapeHtml(r.serial_number)}
          </small>
          ${(r.source_type === "reseller" || (parseFloat(r.cost_price) || 0) > 0 || (r.vendor_name && r.vendor_name.trim())) ? `
            <div class="mt-1 d-flex flex-wrap align-items-center gap-1">
              <span class="badge bg-warning-subtle text-warning-emphasis border" title="Sourced from Reseller / Vendor">
                <i class="bi bi-truck me-1"></i>${escapeHtml(r.vendor_name || "Vendor")} (Buy: ₹${parseFloat(r.cost_price || 0).toFixed(0)})
              </span>
              ${r.vendor_phone ? `
                <a href="${getVendorWhatsAppSupportUrl(r)}" target="_blank" class="badge bg-success bg-opacity-10 text-success border border-success-subtle text-decoration-none" title="Chat with Vendor on WhatsApp for Support/Replacement">
                  <i class="bi bi-whatsapp me-1"></i>Vendor
                </a>
              ` : ""}
            </div>
          ` : `
            <div class="mt-1">
              <span class="badge bg-light text-muted border">
                <i class="bi bi-house-door me-1"></i>In-House
              </span>
            </div>
          `}
        </td>
        <td>
          <div class="fw-semibold">${escapeHtml(r.customer_name || "Customer")}</div>
          ${r.customer_email ? `<small class="text-muted d-block"><i class="bi bi-envelope me-1"></i>${escapeHtml(r.customer_email)}</small>` : ""}
          ${r.customer_mobile ? `<small class="text-muted font-monospace d-block"><i class="bi bi-phone me-1"></i>${escapeHtml(r.customer_mobile)}</small>` : ""}
          ${r.telegram_id ? `<small class="text-info font-monospace d-block"><i class="bi bi-telegram me-1"></i>@${escapeHtml(r.telegram_id.replace(/^@/, ""))}</small>` : ""}
        </td>
        <td>${formatDate(pDate)}</td>
        <td>
          <div class="${isWActive ? "text-success fw-bold" : "text-danger fw-bold"}">
            ${formatDate(expiry)}
          </div>
          <small class="text-muted">${r.warranty_months} ${r.warranty_type || "months"}</small>
          <div class="mt-1">
            <button type="button" class="btn btn-link p-0 small text-decoration-none text-muted" onclick="openRenewalsHistoryModal('${r.id}')" title="View Renewal History">
              <i class="bi bi-clock-history me-1"></i>History
            </button>
          </div>
        </td>
        <td>
          <span class="fw-bold text-dark">
            ${(r.amount !== undefined && r.amount !== null && r.amount !== "") ? `₹${parseFloat(r.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `<span class="text-muted fw-normal">₹0.00</span>`}
          </span>
          ${(() => {
            const amt = parseFloat(r.amount) || 0;
            const cost = parseFloat(r.cost_price) || 0;
            const netProfit = amt - cost;
            if (amt > 0 || cost > 0) {
              const badgeClass = netProfit >= 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger";
              const sign = netProfit >= 0 ? "+" : "";
              return `<div class="small mt-1"><span class="badge ${badgeClass} border">${sign}₹${netProfit.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Profit</span></div>`;
            }
            return "";
          })()}
        </td>
        <td>
          <span class="${badgeClass}">${statusLabel}</span>
        </td>
        <td>
          <div class="d-flex align-items-center gap-1">
            <button class="btn btn-outline-success btn-sm rounded-pill px-2 py-1 fw-semibold d-inline-flex align-items-center gap-1" onclick="openRenewModal('${r.id}')" title="Renew License (Add Validity & Funds)">
              <i class="bi bi-arrow-repeat"></i> Renew
            </button>
            ${r.customer_mobile ? `
            <a href="${waLink}" target="_blank" class="btn btn-whatsapp btn-sm rounded-pill px-2 py-1" title="Send WhatsApp Renewal Reminder">
              <i class="bi bi-whatsapp"></i>
            </a>` : `
            <button class="btn btn-outline-secondary btn-sm rounded-pill px-2 py-1 opacity-50" title="No Mobile Number" disabled>
              <i class="bi bi-whatsapp"></i>
            </button>`}
            ${r.telegram_id || r.customer_mobile ? `
            <a href="${tgLink}" target="_blank" class="btn btn-telegram btn-sm rounded-pill px-2 py-1" title="Send Telegram Renewal Reminder">
              <i class="bi bi-telegram"></i>
            </a>` : `
            <button class="btn btn-outline-secondary btn-sm rounded-pill px-2 py-1 opacity-50" title="No Telegram or Mobile" disabled>
              <i class="bi bi-telegram"></i>
            </button>`}
          </div>
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-success" title="Renew License" onclick="openRenewModal('${r.id}')">
              <i class="bi bi-arrow-repeat"></i>
            </button>
            <button class="btn btn-outline-info" title="Renewal History" onclick="openRenewalsHistoryModal('${r.id}')">
              <i class="bi bi-clock-history"></i>
            </button>
            <button class="btn btn-outline-secondary" title="View Certificate" onclick="openAdminCertificateModal('${r.id}')">
              <i class="bi bi-award"></i>
            </button>
            <button class="btn btn-outline-primary" title="Edit User" onclick="openEditModal('${r.id}')">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" title="Delete User" onclick="deleteWarrantyRecord('${r.id}')">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
}

// ===========================================================================
// ADD & EDIT USER FORM HANDLING & POST-SAVE MODAL
// ===========================================================================

window.openAddModal = function () {
  document.getElementById("warrantyModalTitle").textContent = "Add New User License";
  document.getElementById("editRecordId").value = "";
  document.getElementById("warrantyForm").reset();

  document.getElementById("formPurchaseDate").value = new Date().toISOString().split("T")[0];
  document.getElementById("formWarrantyMonths").value = "12";
  document.getElementById("formValidityMonths").value = "12";
  document.getElementById("formDurationType").value = "month";
  document.getElementById("formAmount").value = "";
  document.getElementById("formCostPrice").value = "";
  document.getElementById("formVendorName").value = "";
  document.getElementById("formVendorPhone").value = "";
  const vendorRefEl = document.getElementById("formVendorRef");
  if (vendorRefEl) vendorRefEl.value = "";
  document.getElementById("formStatus").value = "active";
  document.getElementById("formProductSelect").value = "";

  window.updateProfitPreview();
  populateVendorDatalist();

  const filterInput = document.getElementById("dropdownProductFilter");
  if (filterInput) {
    filterInput.value = "";
    filterProductDropdownOptions("");
  }

  generateRandomSerial();
  warrantyModalInstance.show();
};

window.generateRandomSerial = function () {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  document.getElementById("formSerialNumber").value = `FXZ-2026-${randomNum}`;
};

window.openEditModal = function (id) {
  const item = allWarranties.find((w) => w.id === id);
  if (!item) return;

  document.getElementById("warrantyModalTitle").textContent = "Edit User License";
  document.getElementById("editRecordId").value = item.id;

  // Try matching product in dropdown
  const prodSelect = document.getElementById("formProductSelect");
  let matched = false;
  for (let i = 0; i < prodSelect.options.length; i++) {
    if (prodSelect.options[i].text === item.product_name) {
      prodSelect.selectedIndex = i;
      matched = true;
      break;
    }
  }
  if (!matched) prodSelect.value = "custom";

  document.getElementById("formProductName").value = item.product_name || "";
  document.getElementById("formSerialNumber").value = item.serial_number || "";
  document.getElementById("formCustomerName").value = item.customer_name || "";
  document.getElementById("formCustomerEmail").value = item.customer_email || "";
  document.getElementById("formCustomerMobile").value = item.customer_mobile || "";
  document.getElementById("formCustomerTelegram").value = item.telegram_id || "";
  document.getElementById("formPurchaseDate").value = item.purchase_date || "";
  document.getElementById("formWarrantyMonths").value = item.warranty_months || 12;
  document.getElementById("formValidityMonths").value = item.validity_months || 12;
  document.getElementById("formDurationType").value = item.warranty_type || "month";
  document.getElementById("formAmount").value = (item.amount !== undefined && item.amount !== null && parseFloat(item.amount) > 0) ? item.amount : "";
  document.getElementById("formCostPrice").value = (item.cost_price !== undefined && item.cost_price !== null && parseFloat(item.cost_price) > 0) ? item.cost_price : "";
  document.getElementById("formVendorName").value = item.vendor_name || "";
  document.getElementById("formVendorPhone").value = item.vendor_phone || "";
  const vendorRefEl = document.getElementById("formVendorRef");
  if (vendorRefEl) vendorRefEl.value = item.vendor_ref || "";
  document.getElementById("formStatus").value = item.status || "active";
  document.getElementById("formInvoiceNo").value = item.invoice_no || "";
  document.getElementById("formNotes").value = item.notes || "";

  window.updateProfitPreview();
  populateVendorDatalist();

  warrantyModalInstance.show();
};

window.toggleSourceFields = function () {
  window.updateProfitPreview();
};

window.updateProfitPreview = function () {
  const previewBox = document.getElementById("formProfitPreviewBox");
  const previewText = document.getElementById("formProfitPreviewText");
  const badge = document.getElementById("formProfitBadge");

  const selling = parseFloat(document.getElementById("formAmount")?.value) || 0;
  const cost = parseFloat(document.getElementById("formCostPrice")?.value) || 0;

  const profit = selling - cost;
  const margin = selling > 0 ? ((profit / selling) * 100).toFixed(1) : "0";

  if (badge) {
    if (selling > 0 || cost > 0) {
      const sign = profit >= 0 ? "+" : "";
      badge.textContent = `Margin: ${sign}₹${profit.toFixed(2)} (${margin}%)`;
      badge.className = `badge small ${profit >= 0 ? 'bg-success text-white' : 'bg-danger text-white'} px-2 py-1`;
    } else {
      badge.textContent = "Margin: ₹0.00";
      badge.className = "badge bg-secondary-subtle text-secondary border small px-2 py-1";
    }
  }

  if (!previewBox || !previewText) return;

  if (selling > 0 || cost > 0) {
    if (cost > 0) {
      if (profit >= 0) {
        previewBox.className = "p-2 rounded-2 small alert alert-success mb-0 d-flex align-items-center";
        previewText.innerHTML = `<i class="bi bi-graph-up-arrow text-success me-2 fs-6"></i> <span>Selling: <strong>₹${selling.toFixed(2)}</strong> − Buy: <strong>₹${cost.toFixed(2)}</strong> = <strong>Net Margin: ₹${profit.toFixed(2)} (+${margin}%)</strong></span>`;
      } else {
        previewBox.className = "p-2 rounded-2 small alert alert-warning mb-0 d-flex align-items-center";
        previewText.innerHTML = `<i class="bi bi-exclamation-triangle-fill text-danger me-2 fs-6"></i> <span>Warning: Buy Price (₹${cost.toFixed(2)}) is higher than Selling Price (₹${selling.toFixed(2)}). Loss: <strong>-₹${Math.abs(profit).toFixed(2)}</strong></span>`;
      }
    } else {
      previewBox.className = "p-2 rounded-2 small alert alert-info mb-0 d-flex align-items-center";
      previewText.innerHTML = `<i class="bi bi-house-door-fill text-primary me-2 fs-6"></i> <span>In-House Product (No Buy Price): <strong>100% Net Profit = ₹${selling.toFixed(2)}</strong></span>`;
    }
    previewBox.classList.remove("d-none");
  } else {
    previewBox.classList.add("d-none");
  }
};

function populateVendorDatalist() {
  const datalist = document.getElementById("vendorNameDatalist");
  if (!datalist) return;
  const vendors = new Set();
  allWarranties.forEach((w) => {
    if (w.vendor_name && w.vendor_name.trim()) vendors.add(w.vendor_name.trim());
  });
  if (vendors.size === 0) {
    vendors.add("Techshup OTT");
  }
  let optionsHtml = "";
  vendors.forEach((v) => {
    optionsHtml += `<option value="${escapeHtml(v)}"></option>`;
  });
  datalist.innerHTML = optionsHtml;
}

function getVendorWhatsAppSupportUrl(r) {
  let phone = String(r.vendor_phone || "").trim().replace(/[^0-9]/g, "");
  if (phone.length === 10) phone = "91" + phone;
  const vendorName = r.vendor_name || "Vendor";
  const msg = `Hi ${vendorName}, regarding customer license ${r.serial_number} (${r.product_name}) - customer reported an issue, please check replacement.`;
  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`;
}

async function handleWarrantyFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("editRecordId").value;
  const saveBtn = document.getElementById("saveWarrantyBtn");

  const customerName = document.getElementById("formCustomerName").value.trim();
  const customerEmail = document.getElementById("formCustomerEmail").value.trim().toLowerCase();
  const customerMobile = document.getElementById("formCustomerMobile").value.trim();
  const customerTelegram = document.getElementById("formCustomerTelegram").value.trim();

  // Validate: At least one contact method must be provided!
  if (!customerEmail && !customerMobile && !customerTelegram) {
    alert("Please provide at least one contact method: Customer Email, Mobile (WhatsApp), or Telegram Username / ID.");
    document.getElementById("formCustomerMobile").focus();
    return;
  }

  const rawAmount = document.getElementById("formAmount").value.trim();
  const amountVal = rawAmount !== "" ? parseFloat(rawAmount) : 0;

  const rawCost = document.getElementById("formCostPrice")?.value.trim() || "";
  const costVal = rawCost !== "" ? parseFloat(rawCost) : 0;
  const vendorName = document.getElementById("formVendorName")?.value.trim() || "";
  const vendorPhone = document.getElementById("formVendorPhone")?.value.trim() || "";
  const vendorRef = document.getElementById("formVendorRef")?.value.trim() || "";

  // Sourcing type: reseller if cost or vendor provided, else own product
  const sourceType = (costVal > 0 || vendorName) ? "reseller" : "own";

  const recordData = {
    product_name: document.getElementById("formProductName").value.trim(),
    serial_number: document.getElementById("formSerialNumber").value.trim().toUpperCase(),
    customer_name: customerName || "Customer",
    customer_email: customerEmail,
    customer_mobile: customerMobile,
    telegram_id: customerTelegram,
    purchase_date: document.getElementById("formPurchaseDate").value,
    warranty_months: parseInt(document.getElementById("formWarrantyMonths").value, 10),
    warranty_type: document.getElementById("formDurationType").value,
    validity_months: parseInt(document.getElementById("formValidityMonths").value, 10),
    validity_type: document.getElementById("formDurationType").value,
    amount: isNaN(amountVal) ? 0 : amountVal,
    status: document.getElementById("formStatus").value,
    invoice_no: document.getElementById("formInvoiceNo").value.trim(),
    notes: document.getElementById("formNotes").value.trim(),
    source_type: sourceType,
    vendor_name: vendorName,
    vendor_phone: vendorPhone,
    cost_price: costVal,
    vendor_ref: vendorRef
  };

  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

  try {
    let savedRecord = null;
    if (id) {
      const res = await window.warrantyService.updateWarranty(id, recordData);
      if (res && res.error) throw res.error;
      savedRecord = (res && res.data) ? res.data : { id, ...recordData };
    } else {
      const res = await window.warrantyService.createWarranty(recordData);
      if (res && res.error) throw res.error;
      savedRecord = (res && res.data) ? res.data : recordData;
    }

    warrantyModalInstance.hide();
    await loadWarranties();

    // Show Post-Save Output Confirmation Modal
    showPostSaveOutput(savedRecord);
  } catch (err) {
    console.error("Save error:", err);
    alert("Error saving record: " + (err.message || "Please check that Serial Number is unique."));
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save & Generate Message`;
  }
}

/**
 * Display formatted output confirmation as specifically requested:
 * Product Name : ...
 * activation date : ...
 * Valid till date : ...
 * Notes : ...
 * thanks for choose Foxzen
 */
function showPostSaveOutput(record) {
  if (!record) return;
  const pDate = record.purchase_date ? new Date(record.purchase_date) : new Date();
  const expiry = calculateExpiry(pDate, record.warranty_months || 12, record.warranty_type || "month");
  const actFormatted = formatDate(pDate);
  const expiryFormatted = formatDate(expiry);
  const notesText = record.notes || "Standard License";
  const custName = (record.customer_name && record.customer_name.trim() && record.customer_name !== "Customer")
    ? record.customer_name.trim()
    : "Valued Customer";

  const amtFormatted = (record.amount !== undefined && record.amount !== null && parseFloat(record.amount) > 0)
    ? `💰 *Amount Paid:* ₹${parseFloat(record.amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`
    : "";

  const custEmail = String(record.customer_email || "").trim();
  const emailFormatted = custEmail
    ? `📧 *Customer Email:* ${custEmail}\n`
    : "";

  const outputFormattedText = 
`🎉 *OFFICIAL LICENSE ACTIVATION - FOXZEN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Name:* ${custName}
${emailFormatted}💻 *Product Name:* ${record.product_name}
🔑 *Serial Number:* ${record.serial_number}
📅 *Activation Date:* ${actFormatted}
⏳ *Valid Till:* ${expiryFormatted}
${amtFormatted}📝 *Notes:* ${notesText}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 *Check Status & Download Official Certificate:*
👉 https://www.verifymywarranty.com/

💬 *Need Help or Renewal?*
Feel free to reply to this message anytime!

✨ *Thank You for Choosing FOXZEN!*`;

  document.getElementById("postSaveOutputText").textContent = outputFormattedText;

  // Configure WhatsApp & Telegram links with the exact activation confirmation text
  const waBtn = document.getElementById("postSaveWhatsappBtn");
  const tgBtn = document.getElementById("postSaveTelegramBtn");

  if (record.customer_mobile && record.customer_mobile.trim()) {
    let phone = String(record.customer_mobile || "").trim().replace(/[^0-9]/g, "");
    if (phone.length === 10) {
      phone = "91" + phone;
    }
    waBtn.href = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(outputFormattedText)}`;
    waBtn.classList.remove("disabled", "opacity-50");
  } else {
    waBtn.href = "javascript:void(0)";
    waBtn.classList.add("disabled", "opacity-50");
  }

  if (record.telegram_id && record.telegram_id.trim()) {
    const cleanUser = record.telegram_id.replace(/^@/, "").trim();
    tgBtn.href = `https://t.me/${cleanUser}`;
    tgBtn.classList.remove("disabled", "opacity-50");
  } else if (record.customer_mobile && record.customer_mobile.trim()) {
    tgBtn.href = `https://t.me/share/url?url=&text=${encodeURIComponent(outputFormattedText)}`;
    tgBtn.classList.remove("disabled", "opacity-50");
  } else {
    tgBtn.href = "javascript:void(0)";
    tgBtn.classList.add("disabled", "opacity-50");
  }

  // Reset copy button state
  document.getElementById("copyBtnLabel").textContent = "Copy Message";
  document.getElementById("copyOutputBtn").classList.remove("btn-success");
  document.getElementById("copyOutputBtn").classList.add("btn-primary");

  postSaveModalInstance.show();
}

window.copyPostSaveOutput = function () {
  const text = document.getElementById("postSaveOutputText").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById("copyOutputBtn");
    const label = document.getElementById("copyBtnLabel");
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-success");
    label.innerHTML = '<i class="bi bi-check2"></i> Copied to Clipboard!';

    setTimeout(() => {
      btn.classList.remove("btn-success");
      btn.classList.add("btn-primary");
      label.textContent = "Copy Message";
    }, 2500);
  }).catch((err) => {
    alert("Could not copy automatically. Please select the text and press Ctrl+C.");
  });
};

// ===========================================================================
// SUBSCRIPTION RENEWAL SYSTEM (IDEA 1)
// ===========================================================================

window.currentRenewProductDefault = { duration: 12, type: "month" };

window.openRenewModal = function (id) {
  const item = allWarranties.find((w) => w.id === id);
  if (!item) return;

  document.getElementById("renewWarrantyId").value = item.id;
  document.getElementById("renewModalCustomerName").textContent = item.customer_name || "Valued Customer";
  document.getElementById("renewModalProduct").innerHTML = `<i class="bi bi-box-seam me-1"></i>${escapeHtml(item.product_name)}`;
  document.getElementById("renewModalSerial").innerHTML = `<i class="bi bi-upc me-1"></i>${escapeHtml(item.serial_number)}`;
  
  const contactText = item.customer_mobile || item.customer_email || (item.telegram_id ? `@${item.telegram_id}` : "No contact provided");
  document.getElementById("renewModalContact").innerHTML = `<i class="bi bi-person-lines-fill me-1"></i>${escapeHtml(contactText)}`;

  const pDate = new Date(item.purchase_date);
  const currentExpiry = calculateExpiry(pDate, item.warranty_months, item.warranty_type || "month");
  currentExpiry.setHours(0, 0, 0, 0);
  const currentExpiryStr = currentExpiry.toISOString().split("T")[0];
  document.getElementById("renewOldExpiry").value = currentExpiryStr;
  document.getElementById("renewModalCurrentExpiry").textContent = formatDate(currentExpiry);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0];

  // 1. Renewal / Payment Date: defaults to today, editable
  document.getElementById("renewDate").value = todayStr;

  // 2. Service Start Date: defaults to current expiry if active, or today if expired
  const isExpired = today > currentExpiry;
  const initialStartDate = isExpired ? todayStr : currentExpiryStr;
  const serviceStartInput = document.getElementById("renewServiceStartDate");
  if (serviceStartInput) serviceStartInput.value = initialStartDate;
  
  const serviceStartHint = document.getElementById("renewServiceStartHint");
  if (serviceStartHint) {
    serviceStartHint.textContent = isExpired 
      ? "License is currently expired. Renewal starts from today."
      : `Extending directly from current expiry (${formatDate(currentExpiry)}).`;
  }

  // 3. Product Default Duration setup
  let defDur = 12;
  let defType = item.warranty_type || "month";
  if (allProducts && allProducts.length > 0) {
    const prodMatch = allProducts.find((p) => p.name === item.product_name);
    if (prodMatch) {
      defDur = parseInt(prodMatch.default_warranty_months || prodMatch.default_validity_months, 10) || 12;
      defType = prodMatch.duration_type || "month";
    }
  }
  if (!defDur) {
    defDur = parseInt(item.warranty_months, 10) || 12;
  }

  window.currentRenewProductDefault = {
    duration: defDur,
    type: defType
  };

  const defLabel = document.getElementById("renewDurModeDefaultLabel");
  if (defLabel) {
    defLabel.textContent = `Default (${defDur}${defType === "day" ? "D" : "M"})`;
  }

  const defaultRadio = document.getElementById("renewDurModeDefault");
  if (defaultRadio) defaultRadio.checked = true;

  window.toggleRenewDurationMode();

  // 4. Renewal Price
  let defaultPrice = "";
  if (allProducts && allProducts.length > 0) {
    const prodMatch = allProducts.find((p) => p.name === item.product_name);
    if (prodMatch) {
      const prodAmt = prodMatch.default_amount !== undefined && prodMatch.default_amount !== null ? parseFloat(prodMatch.default_amount) : (parseFloat(prodMatch.amount) || 0);
      if (prodAmt > 0) defaultPrice = prodAmt;
    }
  }
  if (!defaultPrice && item.amount !== undefined && item.amount !== null && parseFloat(item.amount) > 0) {
    defaultPrice = parseFloat(item.amount);
  }
  document.getElementById("renewAmount").value = defaultPrice !== "" ? defaultPrice : "";
  document.getElementById("renewCostPrice").value = (item.cost_price !== undefined && item.cost_price !== null && parseFloat(item.cost_price) > 0) ? item.cost_price : "0.00";

  document.getElementById("renewPaymentRef").value = "";
  document.getElementById("renewNotes").value = "";

  window.updateRenewPreview();
  window.updateRenewProfitPreview();

  if (renewModalInstance) {
    renewModalInstance.show();
  }
};

window.toggleRenewDurationMode = function () {
  const isDefault = document.getElementById("renewDurModeDefault")?.checked;
  const durInput = document.getElementById("renewMonthsAdded");
  const typeSelect = document.getElementById("renewDurationType");
  const hintEl = document.getElementById("renewDurationHint");

  const def = window.currentRenewProductDefault || { duration: 12, type: "month" };

  if (isDefault) {
    if (durInput) {
      durInput.value = def.duration;
      durInput.readOnly = true;
      durInput.classList.remove("bg-white");
    }
    if (typeSelect) {
      typeSelect.value = def.type;
      typeSelect.disabled = true;
    }
    if (hintEl) {
      hintEl.textContent = `Default duration (${def.duration} ${def.type}s) configured for this product`;
    }
  } else {
    if (durInput) {
      durInput.readOnly = false;
      durInput.classList.add("bg-white");
      durInput.focus();
      durInput.select();
    }
    if (typeSelect) {
      typeSelect.disabled = false;
    }
    if (hintEl) {
      hintEl.textContent = "Custom duration: enter custom number of months or days";
    }
  }

  window.updateRenewPreview();
};

window.setServiceStartDateToToday = function () {
  const todayStr = new Date().toISOString().split("T")[0];
  const input = document.getElementById("renewServiceStartDate");
  if (input) {
    input.value = todayStr;
    const hintEl = document.getElementById("renewServiceStartHint");
    if (hintEl) hintEl.textContent = "Service validity set to start from today.";
    window.updateRenewPreview();
  }
};

window.updateRenewPreview = function () {
  const serviceStartDateStr = document.getElementById("renewServiceStartDate")?.value;
  let baseDate = serviceStartDateStr ? new Date(serviceStartDateStr) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const durInput = document.getElementById("renewMonthsAdded");
  const dur = durInput ? (parseInt(durInput.value, 10) || 1) : 1;
  const typeSelect = document.getElementById("renewDurationType");
  const unit = typeSelect ? (typeSelect.value || "month") : "month";

  const newDate = calculateExpiry(baseDate, dur, unit);
  newDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((newDate - today) / (1000 * 60 * 60 * 24));

  const previewEl = document.getElementById("renewPreviewNewDate");
  const diffEl = document.getElementById("renewPreviewDaysDiff");
  if (previewEl) previewEl.textContent = formatDate(newDate);
  if (diffEl) {
    if (diffDays > 0) {
      diffEl.textContent = `Active for ${diffDays} days from today (till ${formatDate(newDate)})`;
    } else if (diffDays === 0) {
      diffEl.textContent = `Valid till end of today (+${dur} ${unit}s)`;
    } else {
      diffEl.textContent = `Expired ${Math.abs(diffDays)} days ago`;
    }
  }
};

window.updateRenewProfitPreview = function () {
  const sell = parseFloat(document.getElementById("renewAmount")?.value) || 0;
  const cost = parseFloat(document.getElementById("renewCostPrice")?.value) || 0;
  const margin = sell - cost;
  const sign = margin >= 0 ? "+" : "";

  const marginValEl = document.getElementById("renewMarginValue");
  const marginBox = document.getElementById("renewMarginPreview");
  if (marginValEl) {
    marginValEl.textContent = `${sign}₹${margin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (marginBox) {
    marginBox.className = margin >= 0
      ? "form-control bg-light fw-bold text-success d-flex align-items-center justify-content-between"
      : "form-control bg-light fw-bold text-danger d-flex align-items-center justify-content-between";
  }
};

window.handleRenewFormSubmit = async function (e) {
  e.preventDefault();
  const warrantyId = document.getElementById("renewWarrantyId").value;
  const btn = document.getElementById("confirmRenewBtn");

  const rawAmount = document.getElementById("renewAmount").value.trim();
  const amountVal = parseFloat(rawAmount);
  if (isNaN(amountVal) || amountVal < 0) {
    alert("Please enter a valid renewal amount (>= 0).");
    document.getElementById("renewAmount").focus();
    return;
  }

  const rawCost = document.getElementById("renewCostPrice")?.value.trim() || "";
  const costVal = rawCost !== "" ? parseFloat(rawCost) : 0;

  const payload = {
    renewal_date: document.getElementById("renewDate")?.value || new Date().toISOString().split("T")[0],
    service_start_date: document.getElementById("renewServiceStartDate")?.value || new Date().toISOString().split("T")[0],
    months_added: parseInt(document.getElementById("renewMonthsAdded").value, 10) || 12,
    duration_type: document.getElementById("renewDurationType").value || "month",
    amount: amountVal,
    cost_price: isNaN(costVal) ? 0 : costVal,
    payment_ref: document.getElementById("renewPaymentRef")?.value.trim() || "",
    notes: document.getElementById("renewNotes")?.value.trim() || ""
  };

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Recording Renewal...`;

  try {
    const res = await window.warrantyService.renewLicense(warrantyId, payload);
    if (res.error) throw res.error;

    if (renewModalInstance) renewModalInstance.hide();
    await loadWarranties();

    if (res.data && res.data.renewal) {
      showPostRenewOutput(res.data.renewal, res.data.warranty);
    }
  } catch (err) {
    console.error("Renewal error:", err);
    alert("Error processing renewal: " + (err.message || "Failed to update record."));
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i> Confirm & Record Renewal`;
  }
};

window.showPostRenewOutput = function (renewal, warranty) {
  const custName = (renewal.customer_name && renewal.customer_name.trim() && renewal.customer_name !== "Customer")
    ? renewal.customer_name.trim()
    : "Valued Customer";

  const renDate = formatDate(new Date(renewal.renewal_date));
  const newExpFormatted = formatDate(new Date(renewal.new_expiry));
  const amountVal = parseFloat(renewal.amount) || 0;

  const custEmail = String(renewal.customer_email || "").trim();
  const emailFormatted = custEmail ? `📧 *Customer Email:* ${custEmail}\n` : "";

  const refFormatted = renewal.payment_ref ? `💳 *Payment Ref:* ${renewal.payment_ref}\n` : "";
  const notesFormatted = renewal.notes ? `📝 *Notes:* ${renewal.notes}\n` : "";

  const outputFormattedText = 
`🎉 *SUBSCRIPTION RENEWED - FOXZEN*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Customer Name:* ${custName}
${emailFormatted}💻 *Product Name:* ${renewal.product_name}
🔑 *Serial Number:* ${renewal.serial_number}
📅 *Renewed On:* ${renDate}
⏳ *New Valid Till:* ${newExpFormatted} (+${renewal.months_added} ${renewal.duration_type || "month"}s)
💰 *Renewal Amount:* ₹${amountVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${refFormatted}${notesFormatted}━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔐 *Check Updated Status & Official Certificate:*
👉 https://www.verifymywarranty.com/

💬 *Need Help or Further Services?*
Feel free to reply to this message anytime!

✨ *Thank You for Continuing with FOXZEN!*`;

  document.getElementById("postRenewOutputText").textContent = outputFormattedText;

  const waBtn = document.getElementById("postRenewWhatsappBtn");
  const tgBtn = document.getElementById("postRenewTelegramBtn");

  if (renewal.customer_mobile && String(renewal.customer_mobile).trim()) {
    let phone = String(renewal.customer_mobile || "").trim().replace(/[^0-9]/g, "");
    if (phone.length === 10) phone = "91" + phone;
    waBtn.href = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(outputFormattedText)}`;
    waBtn.classList.remove("disabled", "opacity-50");
  } else {
    waBtn.href = "javascript:void(0)";
    waBtn.classList.add("disabled", "opacity-50");
  }

  const tg = String(warranty?.telegram_id || "").replace(/^@/, "").trim();
  if (tg) {
    tgBtn.href = `https://t.me/${tg}?text=${encodeURIComponent(outputFormattedText)}`;
    tgBtn.classList.remove("disabled", "opacity-50");
  } else if (renewal.customer_mobile && String(renewal.customer_mobile).trim()) {
    let phone = String(renewal.customer_mobile || "").trim().replace(/[^0-9]/g, "");
    if (phone.length === 10) phone = "+91" + phone;
    tgBtn.href = `https://t.me/+${phone.replace(/[^0-9]/g, "")}`;
    tgBtn.classList.remove("disabled", "opacity-50");
  } else {
    tgBtn.href = "javascript:void(0)";
    tgBtn.classList.add("disabled", "opacity-50");
  }

  // Reset copy button
  document.getElementById("copyRenewBtnLabel").textContent = "Copy Message";
  document.getElementById("copyRenewOutputBtn").classList.remove("btn-primary");
  document.getElementById("copyRenewOutputBtn").classList.add("btn-success");

  if (postRenewModalInstance) {
    postRenewModalInstance.show();
  }
};

window.copyPostRenewOutput = function () {
  const text = document.getElementById("postRenewOutputText").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const label = document.getElementById("copyRenewBtnLabel");
    label.innerHTML = '<i class="bi bi-check2"></i> Copied to Clipboard!';
    setTimeout(() => {
      label.textContent = "Copy Message";
    }, 2500);
  }).catch(() => {
    alert("Could not copy automatically. Please select text and press Ctrl+C.");
  });
};

window.openRenewalsHistoryModal = async function (warrantyId) {
  const item = allWarranties.find((w) => w.id === warrantyId);
  if (!item) return;

  document.getElementById("historyCustomerName").textContent = item.customer_name || "Valued Customer";
  document.getElementById("historyProductSerial").innerHTML = `${escapeHtml(item.product_name)} • <span class="font-monospace text-primary">${escapeHtml(item.serial_number)}</span>`;

  const tbody = document.getElementById("renewalsHistoryTableBody");
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Fetching renewals history...</td></tr>`;

  if (renewalsHistoryModalInstance) {
    renewalsHistoryModalInstance.show();
  }

  try {
    const res = await window.warrantyService.getRenewalsByWarranty(warrantyId);
    const list = res.data || [];

    let totalAmount = (item.amount !== undefined && item.amount !== null) ? parseFloat(item.amount) : 0;
    document.getElementById("historyTotalCollected").textContent = `Total Paid: ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">
            <i class="bi bi-info-circle fs-4 d-block mb-1 text-secondary"></i>
            No separate renewal transactions recorded yet for this license.<br>
            <small class="text-muted">Initial Activation Price: ₹${(parseFloat(item.amount) || 0).toFixed(2)}</small>
          </td>
        </tr>
      `;
      return;
    }

    let rowsHtml = "";
    list.forEach((ren) => {
      const amt = parseFloat(ren.amount) || 0;
      const cost = parseFloat(ren.cost_price) || 0;
      const margin = amt - cost;
      const sign = margin >= 0 ? "+" : "";

      rowsHtml += `
        <tr>
          <td class="fw-semibold text-dark">${formatDate(new Date(ren.renewal_date))}</td>
          <td>
            <span class="badge bg-primary-subtle text-primary border">+${ren.months_added} ${ren.duration_type || "month"}s</span>
            ${ren.service_start_date ? `<small class="text-muted d-block mt-1">From: ${formatDate(new Date(ren.service_start_date))}</small>` : ""}
          </td>
          <td class="text-success fw-semibold">${formatDate(new Date(ren.new_expiry))}</td>
          <td class="fw-bold text-dark">₹${amt.toFixed(2)}</td>
          <td><span class="badge ${margin >= 0 ? "bg-success-subtle text-success" : "bg-danger-subtle text-danger"} border">${sign}₹${margin.toFixed(2)}</span></td>
          <td>
            <small class="text-muted d-block">${escapeHtml(ren.payment_ref || "Direct")}</small>
            ${ren.notes ? `<small class="text-secondary fst-italic">${escapeHtml(ren.notes)}</small>` : ""}
          </td>
          <td class="text-end">
            <div class="d-inline-flex gap-1">
              <button class="btn btn-outline-primary btn-sm rounded-pill px-2 py-0" title="Edit Renewal" onclick="openEditRenewalModal('${ren.id}', '${warrantyId}')">
                <i class="bi bi-pencil"></i> Edit
              </button>
              <button class="btn btn-outline-danger btn-sm rounded-pill px-2 py-0" title="Delete Renewal (Revert Expiry & Funds)" onclick="deleteRenewalRecord('${ren.id}', '${warrantyId}', this)">
                <i class="bi bi-trash"></i> Delete
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    tbody.innerHTML = rowsHtml;
  } catch (err) {
    console.error("Error loading renewals history:", err);
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-danger">Failed to load renewal history.</td></tr>`;
  }
};

window.openEditRenewalModal = async function (renewalId, warrantyId) {
  const warranty = allWarranties.find((w) => w.id === warrantyId);
  if (!warranty) return;

  const renRes = await window.warrantyService.getRenewalsByWarranty(warrantyId);
  const ren = (renRes.data || []).find((r) => r.id === renewalId);
  if (!ren) {
    alert("Renewal record not found.");
    return;
  }

  document.getElementById("editRenewalId").value = ren.id;
  document.getElementById("editRenewalWarrantyId").value = warrantyId;

  document.getElementById("editRenewalCustomerName").textContent = warranty.customer_name || "Valued Customer";
  document.getElementById("editRenewalProduct").innerHTML = `<i class="bi bi-box-seam me-1"></i>${escapeHtml(warranty.product_name)}`;
  document.getElementById("editRenewalSerial").innerHTML = `<i class="bi bi-upc me-1"></i>${escapeHtml(warranty.serial_number)}`;
  
  const oldExpFormatted = ren.old_expiry ? formatDate(new Date(ren.old_expiry)) : "N/A";
  document.getElementById("editRenewalOldExpiryBadge").textContent = oldExpFormatted;

  document.getElementById("editRenewalDate").value = ren.renewal_date ? ren.renewal_date.split("T")[0] : "";
  document.getElementById("editRenewalServiceStartDate").value = ren.service_start_date ? ren.service_start_date.split("T")[0] : (ren.renewal_date ? ren.renewal_date.split("T")[0] : "");
  document.getElementById("editRenewalMonthsAdded").value = ren.months_added || 12;
  document.getElementById("editRenewalDurationType").value = ren.duration_type || "month";

  document.getElementById("editRenewalAmount").value = (ren.amount !== undefined && ren.amount !== null) ? ren.amount : "0.00";
  document.getElementById("editRenewalCostPrice").value = (ren.cost_price !== undefined && ren.cost_price !== null) ? ren.cost_price : "0.00";

  document.getElementById("editRenewalPaymentRef").value = ren.payment_ref || "";
  document.getElementById("editRenewalNotes").value = ren.notes || "";

  window.updateEditRenewalPreview();
  window.updateEditRenewalProfitPreview();

  if (editRenewalModalInstance) {
    editRenewalModalInstance.show();
  }
};

window.updateEditRenewalPreview = function () {
  const serviceStartDateStr = document.getElementById("editRenewalServiceStartDate")?.value;
  let baseDate = serviceStartDateStr ? new Date(serviceStartDateStr) : new Date();
  baseDate.setHours(0, 0, 0, 0);

  const dur = parseInt(document.getElementById("editRenewalMonthsAdded")?.value, 10) || 1;
  const unit = document.getElementById("editRenewalDurationType")?.value || "month";

  const newDate = calculateExpiry(baseDate, dur, unit);
  newDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((newDate - today) / (1000 * 60 * 60 * 24));

  const previewEl = document.getElementById("editRenewalPreviewNewDate");
  const diffEl = document.getElementById("editRenewalPreviewDaysDiff");
  if (previewEl) previewEl.textContent = formatDate(newDate);
  if (diffEl) {
    if (diffDays > 0) {
      diffEl.textContent = `Valid for ${diffDays} days from today (till ${formatDate(newDate)})`;
    } else if (diffDays === 0) {
      diffEl.textContent = `Valid till end of today (+${dur} ${unit}s)`;
    } else {
      diffEl.textContent = `Expired ${Math.abs(diffDays)} days ago`;
    }
  }
};

window.updateEditRenewalProfitPreview = function () {
  const sell = parseFloat(document.getElementById("editRenewalAmount")?.value) || 0;
  const cost = parseFloat(document.getElementById("editRenewalCostPrice")?.value) || 0;
  const margin = sell - cost;
  const sign = margin >= 0 ? "+" : "";

  const marginValEl = document.getElementById("editRenewalMarginValue");
  const marginBox = document.getElementById("editRenewalMarginPreview");
  if (marginValEl) {
    marginValEl.textContent = `${sign}₹${margin.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (marginBox) {
    marginBox.className = margin >= 0
      ? "form-control bg-light fw-bold text-success d-flex align-items-center justify-content-between"
      : "form-control bg-light fw-bold text-danger d-flex align-items-center justify-content-between";
  }
};

window.handleEditRenewalFormSubmit = async function (e) {
  e.preventDefault();
  const renewalId = document.getElementById("editRenewalId").value;
  const warrantyId = document.getElementById("editRenewalWarrantyId").value;
  const btn = document.getElementById("saveEditRenewalBtn");

  const rawAmount = document.getElementById("editRenewalAmount").value.trim();
  const amountVal = parseFloat(rawAmount);
  if (isNaN(amountVal) || amountVal < 0) {
    alert("Please enter a valid renewal amount (>= 0).");
    document.getElementById("editRenewalAmount").focus();
    return;
  }

  const rawCost = document.getElementById("editRenewalCostPrice")?.value.trim() || "";
  const costVal = rawCost !== "" ? parseFloat(rawCost) : 0;

  const updates = {
    renewal_date: document.getElementById("editRenewalDate")?.value || new Date().toISOString().split("T")[0],
    service_start_date: document.getElementById("editRenewalServiceStartDate")?.value || new Date().toISOString().split("T")[0],
    months_added: parseInt(document.getElementById("editRenewalMonthsAdded").value, 10) || 12,
    duration_type: document.getElementById("editRenewalDurationType").value || "month",
    amount: amountVal,
    cost_price: isNaN(costVal) ? 0 : costVal,
    payment_ref: document.getElementById("editRenewalPaymentRef")?.value.trim() || "",
    notes: document.getElementById("editRenewalNotes")?.value.trim() || ""
  };

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

  try {
    const res = await window.warrantyService.updateRenewal(renewalId, warrantyId, updates);
    if (res.error) throw res.error;

    if (editRenewalModalInstance) editRenewalModalInstance.hide();
    await loadWarranties();
    await openRenewalsHistoryModal(warrantyId);
  } catch (err) {
    console.error("Edit renewal error:", err);
    alert("Failed to update renewal: " + (err.message || "Unknown error"));
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Changes`;
  }
};

window.deleteRenewalRecord = async function (renewalId, warrantyId, btnEl) {
  if (!confirm("Are you sure you want to delete this renewal record?\n\nThis will undo this renewal transaction: the added validity will be reverted and the renewal amount will be deducted from this customer's total.")) {
    return;
  }

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
  }

  try {
    const res = await window.warrantyService.deleteRenewal(renewalId, warrantyId);
    if (res.error) throw res.error;

    // Reload main table & stats
    await loadWarranties();

    // Re-render the history modal for this customer
    await openRenewalsHistoryModal(warrantyId);
  } catch (err) {
    console.error("Delete renewal error:", err);
    alert("Failed to delete renewal: " + (err.message || "Unknown error"));
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = `<i class="bi bi-trash"></i> Delete`;
    }
  }
};

window.deleteWarrantyRecord = async function (id) {
  const item = allWarranties.find((w) => w.id === id);
  const name = item ? `${item.product_name} (${item.customer_name})` : "this record";

  if (!confirm(`Are you sure you want to delete ${name}?`)) {
    return;
  }

  try {
    await window.warrantyService.deleteWarranty(id);
    await loadWarranties();
  } catch (err) {
    console.error("Delete error:", err);
    alert("Failed to delete record: " + err.message);
  }
};

// ===========================================================================
// CSV IMPORT & EXPORT
// ===========================================================================

window.exportToCSV = function () {
  if (allWarranties.length === 0) {
    alert("No records to export.");
    return;
  }

  const headers = [
    "Product Name",
    "Serial Number",
    "Customer Name",
    "Customer Email",
    "Customer Mobile",
    "Telegram ID",
    "Purchase Date",
    "Warranty Months",
    "Amount",
    "Status",
    "Invoice No",
    "Notes"
  ];

  const rows = allWarranties.map((w) => [
    `"${(w.product_name || "").replace(/"/g, '""')}"`,
    `"${(w.serial_number || "").replace(/"/g, '""')}"`,
    `"${(w.customer_name || "").replace(/"/g, '""')}"`,
    `"${(w.customer_email || "").replace(/"/g, '""')}"`,
    `"${(w.customer_mobile || "").replace(/"/g, '""')}"`,
    `"${(w.telegram_id || "").replace(/"/g, '""')}"`,
    `"${w.purchase_date || ""}"`,
    w.warranty_months || 12,
    parseFloat(w.amount || 0).toFixed(2),
    `"${w.status || "active"}"`,
    `"${(w.invoice_no || "").replace(/"/g, '""')}"`,
    `"${(w.notes || "").replace(/"/g, '""')}"`
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `foxzen_users_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function handleCSVFileSelection(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (evt) {
    try {
      const text = evt.target.result;
      const records = parseCSV(text);
      parsedCSVRecords = records;

      if (records.length === 0) {
        alert("No valid rows found in CSV.");
        return;
      }

      document.getElementById("csvRowCount").textContent = records.length;
      const tbody = document.querySelector("#csvPreviewTable tbody");
      tbody.innerHTML = records
        .slice(0, 5)
        .map(
          (r) => `
        <tr>
          <td>${escapeHtml(r.product_name)}</td>
          <td>${escapeHtml(r.serial_number)}</td>
          <td>${escapeHtml(r.customer_name)}</td>
          <td>${escapeHtml(r.customer_email)}</td>
          <td>${escapeHtml(r.customer_mobile)}</td>
          <td>${escapeHtml(r.purchase_date)}</td>
        </tr>
      `
        )
        .join("");

      document.getElementById("csvPreviewSection").classList.remove("d-none");
      document.getElementById("confirmImportBtn").disabled = false;
    } catch (err) {
      alert("Error reading CSV: " + err.message);
    }
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const rawCols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
    const cols = rawCols.map((c) => c.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));

    if (cols.length >= 4) {
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = cols[idx] !== undefined ? cols[idx] : "";
      });

      const rawAmount = row.amount || row.price || row.fee || "0";
      const amountVal = parseFloat(rawAmount) || 0;

      records.push({
        product_name: row.product_name || row.product || "Foxzen Service",
        serial_number: (row.serial_number || row.serial || "FXZ-" + Date.now()).toUpperCase(),
        customer_name: row.customer_name || row.name || "Customer",
        customer_email: (row.customer_email || row.email || "support@foxzen.com").toLowerCase(),
        customer_mobile: row.customer_mobile || row.mobile || row.phone || "0000000000",
        telegram_id: row.telegram_id || row.telegram || "",
        purchase_date: row.purchase_date || new Date().toISOString().split("T")[0],
        warranty_months: parseInt(row.warranty_months || row.months || "12", 10),
        warranty_type: "month",
        validity_months: parseInt(row.validity_months || row.warranty_months || "12", 10),
        validity_type: "month",
        amount: amountVal,
        status: row.status || "active",
        invoice_no: row.invoice_no || row.invoice || "",
        notes: row.notes || "Imported via CSV"
      });
    }
  }

  return records;
}

window.executeCSVImport = async function () {
  if (parsedCSVRecords.length === 0) return;

  const btn = document.getElementById("confirmImportBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Importing...`;

  try {
    const { count, error } = await window.warrantyService.bulkImport(parsedCSVRecords);
    if (error) throw error;

    alert(`Successfully imported ${count} users!`);
    importModalInstance.hide();
    document.getElementById("csvFileInput").value = "";
    document.getElementById("csvPreviewSection").classList.add("d-none");
    await loadWarranties();
  } catch (err) {
    alert("Import failed: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="bi bi-upload me-1"></i> Import Records`;
  }
};

window.downloadSampleCSV = function () {
  const content =
    "product_name,serial_number,customer_name,customer_email,customer_mobile,purchase_date,warranty_months,amount,status,invoice_no\r\n" +
    '"Foxzen License Pro 1-Year","FXZ-2026-9921","John Doe","john@example.com","+91 9876543210","2026-06-15",12,1499.00,"active","INV-001"\r\n' +
    '"MacBook Pro 16","VMW-MBP-9921","Sarah Connor","sarah@example.com","+1 555-901-4433","2026-08-01",24,4999.00,"active","INV-103"\r\n';

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "foxzen_users_sample.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ===========================================================================
// CERTIFICATE MODAL
// ===========================================================================

window.openAdminCertificateModal = function (id) {
  const product = allWarranties.find((w) => w.id === id);
  if (!product) return;

  const pDate = new Date(product.purchase_date);
  const wExp = calculateExpiry(pDate, product.warranty_months, product.warranty_type || "month");
  const isWActive = new Date() <= wExp && product.status !== "void";

  const certHtml = `
    <div id="printableCertificate" class="certificate-box text-center p-4">
      <div class="certificate-watermark">VERIFIED</div>
      
      <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
        <div class="text-start">
          <h4 class="fw-bold text-primary mb-0"><i class="bi bi-shield-check"></i> Foxzen Warranty</h4>
          <small class="text-muted">Official Verification Certificate</small>
        </div>
        <div class="text-end">
          <span class="badge ${isWActive ? "bg-success" : "bg-danger"} fs-6 px-3 py-2">
            ${isWActive ? "LICENSE ACTIVE" : "LICENSE EXPIRED"}
          </span>
        </div>
      </div>

      <h3 class="fw-bold mb-1">${escapeHtml(product.product_name)}</h3>
      <p class="text-muted mb-4 font-monospace">Serial Number: <strong>${escapeHtml(
        product.serial_number
      )}</strong></p>

      <div class="row text-start g-3 mb-4 bg-light p-3 rounded">
        <div class="col-6">
          <small class="text-muted d-block">Customer Name</small>
          <strong>${escapeHtml(product.customer_name || "Valued Customer")}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Registered Email</small>
          <strong>${escapeHtml(product.customer_email || "N/A")}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Registered Phone</small>
          <strong>${escapeHtml(product.customer_mobile || "N/A")}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Activation Date</small>
          <strong>${formatDate(pDate)}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Valid Till Date</small>
          <strong class="${isWActive ? "text-success" : "text-danger"}">${formatDate(wExp)}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Invoice / Reference</small>
          <strong>${escapeHtml(product.invoice_no || "N/A")}</strong>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center pt-3 border-top text-muted small">
        <span>Verified via Foxzen Portal</span>
        <span>Certificate ID: ${product.id || "FXZ-" + Date.now()}</span>
      </div>
    </div>
  `;

  document.getElementById("adminCertificateModalBody").innerHTML = certHtml;
  const modal = new bootstrap.Modal(document.getElementById("adminCertificateModal"));
  modal.show();
};

// ===========================================================================
// UTILITY HELPERS
// ===========================================================================

function calculateExpiry(startDate, duration, type) {
  const expiry = new Date(startDate);
  const dur = parseInt(duration, 10) || 0;
  if (type === "day") {
    expiry.setDate(expiry.getDate() + dur);
  } else {
    expiry.setMonth(expiry.getMonth() + dur);
  }
  return expiry;
}

function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return "N/A";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ===========================================================================
// REVENUE DASHBOARD LOGIC
// ===========================================================================

let currentRevenuePeriod = "all";

window.setRevenuePeriod = function (period) {
  currentRevenuePeriod = period;
  const btns = ["revPeriodAll", "revPeriodMonth", "revPeriodToday"];
  btns.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  if (period === "month") {
    document.getElementById("revPeriodMonth")?.classList.add("active");
  } else if (period === "today") {
    document.getElementById("revPeriodToday")?.classList.add("active");
  } else {
    document.getElementById("revPeriodAll")?.classList.add("active");
  }

  renderRevenueDashboard();
};

window.renderRevenueDashboard = function () {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = now.toISOString().split("T")[0];

  let totalGrossRevenue = 0;
  let totalVendorCost = 0;
  let totalNetProfit = 0;
  let totalCount = 0;

  let monthGrossRevenue = 0;
  let monthVendorCost = 0;
  let monthNetProfit = 0;
  let monthCount = 0;

  let todayGrossRevenue = 0;
  let todayVendorCost = 0;
  let todayNetProfit = 0;
  let todayCount = 0;

  let activeRevenue = 0;
  let activeCount = 0;
  let expiredRevenue = 0;
  let expiredCount = 0;
  let voidRevenue = 0;
  let voidCount = 0;

  const productMap = {};

  allWarranties.forEach((r) => {
    const amt = parseFloat(r.amount) || 0;
    const cost = parseFloat(r.cost_price) || 0;
    const profit = amt - cost;

    totalGrossRevenue += amt;
    totalVendorCost += cost;
    totalNetProfit += profit;
    totalCount++;

    // Check date for month & today
    const pDate = new Date(r.purchase_date);
    if (!isNaN(pDate)) {
      if (pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth) {
        monthGrossRevenue += amt;
        monthVendorCost += cost;
        monthNetProfit += profit;
        monthCount++;
      }
      const pDateStr = r.purchase_date ? r.purchase_date.split("T")[0] : "";
      if (pDateStr === todayStr) {
        todayGrossRevenue += amt;
        todayVendorCost += cost;
        todayNetProfit += profit;
        todayCount++;
      }
    }

    // Status breakdown
    const isVoid = r.status === "void";
    const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);
    const todayCheck = new Date();
    todayCheck.setHours(0, 0, 0, 0);
    const isWActive = !isVoid && todayCheck <= expiry && r.status !== "expired";

    if (isVoid) {
      voidRevenue += amt;
      voidCount++;
    } else if (isWActive) {
      activeRevenue += amt;
      activeCount++;
    } else {
      expiredRevenue += amt;
      expiredCount++;
    }

    // Product breakdown
    const prodName = r.product_name || "Custom License";
    if (!productMap[prodName]) {
      productMap[prodName] = {
        name: prodName,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        licenseCount: 0
      };
    }
    productMap[prodName].totalRevenue += amt;
    productMap[prodName].totalCost += cost;
    productMap[prodName].totalProfit += profit;
    productMap[prodName].licenseCount++;
  });

  const formatINR = (val) => "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // 1. Total Net Profit
  const totalEl = document.getElementById("revTotalAmount");
  if (totalEl) totalEl.textContent = formatINR(totalNetProfit);
  const totalCountEl = document.getElementById("revTotalCount");
  if (totalCountEl) totalCountEl.textContent = `Sales: ${formatINR(totalGrossRevenue)} | Cost: ${formatINR(totalVendorCost)}`;

  // 2. This Month Net Profit
  const monthEl = document.getElementById("revMonthAmount");
  if (monthEl) monthEl.textContent = formatINR(monthNetProfit);
  const monthCountEl = document.getElementById("revMonthCount");
  if (monthCountEl) monthCountEl.textContent = `Net Profit in ${now.toLocaleString("en-US", { month: "short" })} (${monthCount} licenses)`;

  // 3. Today's Net Profit
  const todayEl = document.getElementById("revTodayAmount");
  if (todayEl) todayEl.textContent = formatINR(todayNetProfit);
  const todayCountEl = document.getElementById("revTodayCount");
  if (todayCountEl) todayCountEl.textContent = `Today Net In-Pocket (${todayCount} licenses)`;

  // 4. Total Reseller Cost
  const costEl = document.getElementById("revAvgAmount");
  if (costEl) costEl.textContent = formatINR(totalVendorCost);
  const costSub = document.getElementById("revCostSubtext");
  if (costSub) {
    const margin = totalGrossRevenue > 0 ? ((totalNetProfit / totalGrossRevenue) * 100).toFixed(1) : "0";
    costSub.textContent = `Paid to Resellers (${margin}% Net Margin)`;
  }

  const activeTotEl = document.getElementById("revActiveTotal");
  if (activeTotEl) activeTotEl.textContent = formatINR(activeRevenue);
  const activeCntEl = document.getElementById("revActiveCount");
  if (activeCntEl) activeCntEl.textContent = `${activeCount} users`;
  const activeShareEl = document.getElementById("revActiveShare");
  if (activeShareEl) {
    const pct = totalGrossRevenue > 0 ? Math.round((activeRevenue / totalGrossRevenue) * 100) : 0;
    activeShareEl.textContent = `${pct}% of total revenue`;
  }

  const expTotEl = document.getElementById("revExpiredTotal");
  if (expTotEl) expTotEl.textContent = formatINR(expiredRevenue);
  const expCntEl = document.getElementById("revExpiredCount");
  if (expCntEl) expCntEl.textContent = `${expiredCount} users`;

  const voidTotEl = document.getElementById("revVoidTotal");
  if (voidTotEl) voidTotEl.textContent = formatINR(voidRevenue);
  const voidCntEl = document.getElementById("revVoidCount");
  if (voidCntEl) voidCntEl.textContent = `${voidCount} users`;

  renderProductRevenueBreakdown(productMap, totalGrossRevenue);
  filterRevenueTransactions();
};

function renderProductRevenueBreakdown(productMap, totalRevenue) {
  const container = document.getElementById("revProductBreakdownContainer");
  const badge = document.getElementById("revProductCountBadge");
  if (!container) return;

  const productsList = Object.values(productMap).sort((a, b) => b.totalProfit - a.totalProfit);
  if (badge) badge.textContent = `${productsList.length} Products`;

  if (productsList.length === 0) {
    container.innerHTML = `<div class="text-center py-4 text-muted"><i class="bi bi-inbox d-block fs-3 mb-2"></i>No product revenue records yet.</div>`;
    return;
  }

  const formatINR = (val) => "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  let html = "";
  const progressColors = ["bg-success", "bg-primary", "bg-warning", "bg-info", "bg-secondary"];

  productsList.forEach((p, idx) => {
    const percentage = totalRevenue > 0 ? ((p.totalRevenue / totalRevenue) * 100).toFixed(1) : 0;
    const colorClass = progressColors[idx % progressColors.length];

    html += `
      <div class="mb-3">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <div class="fw-semibold text-dark">
            <i class="bi bi-box-seam me-1 text-muted"></i> ${escapeHtml(p.name)}
            <small class="text-muted ms-1">(${p.licenseCount} ${p.licenseCount === 1 ? "license" : "licenses"})</small>
          </div>
          <div class="text-end">
            <span class="fw-bold text-success">${formatINR(p.totalProfit)} Profit</span>
            <small class="badge bg-light text-secondary border ms-2">Sales: ${formatINR(p.totalRevenue)}${p.totalCost > 0 ? ` | Cost: ${formatINR(p.totalCost)}` : ""}</small>
          </div>
        </div>
        <div class="progress" style="height: 8px;">
          <div class="progress-bar ${colorClass}" role="progressbar" style="width: ${percentage}%;" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

window.filterRevenueTransactions = function () {
  const searchInput = document.getElementById("revenueTxSearch");
  const query = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const tbody = document.getElementById("revenueTransactionsBody");
  const emptyState = document.getElementById("emptyRevenueTxState");
  if (!tbody) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const todayStr = now.toISOString().split("T")[0];

  let filtered = allWarranties.filter((r) => {
    // Filter by period
    if (currentRevenuePeriod === "month") {
      const pDate = new Date(r.purchase_date);
      if (isNaN(pDate) || pDate.getFullYear() !== currentYear || pDate.getMonth() !== currentMonth) {
        return false;
      }
    } else if (currentRevenuePeriod === "today") {
      const pDateStr = r.purchase_date ? r.purchase_date.split("T")[0] : "";
      if (pDateStr !== todayStr) {
        return false;
      }
    }

    // Filter by search query
    if (query) {
      const matchCustomer = (r.customer_name || "").toLowerCase().includes(query);
      const matchEmail = (r.customer_email || "").toLowerCase().includes(query);
      const matchPhone = (r.customer_mobile || "").toLowerCase().includes(query);
      const matchProduct = (r.product_name || "").toLowerCase().includes(query);
      const matchSerial = (r.serial_number || "").toLowerCase().includes(query);
      const matchInvoice = (r.invoice_no || "").toLowerCase().includes(query);
      return matchCustomer || matchEmail || matchPhone || matchProduct || matchSerial || matchInvoice;
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  const formatINR = (val) => "₹" + val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = "";
  filtered.forEach((r) => {
    const pDate = new Date(r.purchase_date);
    const expiry = calculateExpiry(pDate, r.warranty_months, r.warranty_type || "month");
    expiry.setHours(0, 0, 0, 0);
    const isWActive = today <= expiry && r.status !== "void";

    let badgeClass = "badge bg-success-subtle text-success border border-success-subtle";
    let statusLabel = "Active";
    if (r.status === "void") {
      badgeClass = "badge bg-secondary-subtle text-secondary border border-secondary-subtle";
      statusLabel = "Void";
    } else if (!isWActive) {
      badgeClass = "badge bg-danger-subtle text-danger border border-danger-subtle";
      statusLabel = "Expired";
    }

    const amt = parseFloat(r.amount) || 0;

    html += `
      <tr>
        <td>
          <div class="fw-semibold text-dark">${formatDate(pDate)}</div>
          <small class="text-muted font-monospace"><i class="bi bi-receipt me-1"></i>${escapeHtml(r.invoice_no || "N/A")}</small>
        </td>
        <td>
          <div class="fw-bold">${escapeHtml(r.customer_name || "Customer")}</div>
          <small class="text-muted font-monospace">${escapeHtml(r.customer_mobile || r.customer_email || "N/A")}</small>
        </td>
        <td>
          <div class="text-dark fw-semibold">${escapeHtml(r.product_name)}</div>
          <small class="text-secondary font-monospace"><i class="bi bi-upc me-1"></i>${escapeHtml(r.serial_number)}</small>
        </td>
        <td>
          <span class="${badgeClass} px-2 py-1 rounded-pill">${statusLabel}</span>
        </td>
        <td class="text-end">
          <span class="fw-bold text-success fs-6">${formatINR(amt)}</span>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};

window.exportRevenueCSV = function () {
  if (allWarranties.length === 0) {
    alert("No records to export.");
    return;
  }

  const headers = [
    "Date",
    "Invoice No",
    "Customer Name",
    "Customer Contact",
    "Product Name",
    "Serial Number",
    "Status",
    "Amount (INR)"
  ];

  const rows = allWarranties.map((w) => [
    `"${w.purchase_date || ""}"`,
    `"${(w.invoice_no || "").replace(/"/g, '""')}"`,
    `"${(w.customer_name || "").replace(/"/g, '""')}"`,
    `"${(w.customer_mobile || w.customer_email || "").replace(/"/g, '""')}"`,
    `"${(w.product_name || "").replace(/"/g, '""')}"`,
    `"${(w.serial_number || "").replace(/"/g, '""')}"`,
    `"${w.status || "active"}"`,
    parseFloat(w.amount || 0).toFixed(2)
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `foxzen_revenue_report_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ===========================================================================
// ADMIN SECURITY & MASTER PASSWORD MANAGER
// ===========================================================================

let securityModalInstance = null;

async function computeSha256(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

window.openSecurityModal = function () {
  if (!securityModalInstance) {
    const el = document.getElementById("securityModal");
    if (el) securityModalInstance = new bootstrap.Modal(el);
  }

  const passInput = document.getElementById("newMasterPassword");
  if (passInput) passInput.value = "";
  const meterBox = document.getElementById("secStrengthMeterBox");
  if (meterBox) meterBox.style.display = "none";

  updateSecurityStatusUI();
  if (securityModalInstance) securityModalInstance.show();
};

async function updateSecurityStatusUI() {
  const statusText = document.getElementById("secCurrentStatusText");
  const badge = document.getElementById("secStatusBadge");
  const emailInput = document.getElementById("newAdminEmail");
  const emailDisplay = document.getElementById("secCurrentEmailDisplay");
  const hashDisplay = document.getElementById("secCurrentHashDisplay");
  const sqlSnippet = document.getElementById("secSqlSnippet");

  if (statusText) statusText.textContent = "Connecting to Supabase...";
  if (badge) {
    badge.className = "badge bg-secondary text-white px-3 py-2 rounded-pill";
    badge.textContent = "Connecting...";
  }

  let activeEmail = localStorage.getItem("foxzen_admin_email") || "admin@foxzen.com";
  let activeHash = localStorage.getItem("foxzen_admin_hash") || "";

  try {
    let sbFound = false;
    if (window.warrantyService && window.warrantyService.client) {
      const { data, error } = await window.warrantyService.client
        .from("admin_credentials")
        .select("email, password_hash, updated_at")
        .eq("id", "admin")
        .maybeSingle();

      if (!error && data) {
        sbFound = true;
        activeEmail = data.email || activeEmail;
        activeHash = data.password_hash || activeHash;
        localStorage.setItem("foxzen_admin_email", activeEmail);
        localStorage.setItem("foxzen_admin_hash", activeHash);
      }
    }

    if (emailInput && !emailInput.value) emailInput.value = activeEmail;
    if (emailDisplay) emailDisplay.value = activeEmail;
    if (hashDisplay) hashDisplay.value = activeHash || "No custom hash yet (default active)";
    if (sqlSnippet) {
      sqlSnippet.textContent = `SELECT public.update_admin_account('${activeEmail}', 'YourNewPassword123!');`;
    }

    if (sbFound) {
      if (statusText) statusText.textContent = `Active & Verified in Supabase (${activeEmail})`;
      if (badge) {
        badge.className = "badge bg-success text-white px-3 py-2 rounded-pill";
        badge.innerHTML = '<i class="bi bi-cloud-check-fill me-1"></i> Saved in Supabase';
      }
    } else if (activeHash) {
      if (statusText) statusText.textContent = `Custom Credentials Active locally (${activeEmail})`;
      if (badge) {
        badge.className = "badge bg-primary text-white px-3 py-2 rounded-pill";
        badge.innerHTML = '<i class="bi bi-shield-check me-1"></i> Custom Active';
      }
    } else {
      if (statusText) statusText.textContent = "Ready to configure credentials in Supabase";
      if (badge) {
        badge.className = "badge bg-info text-white px-3 py-2 rounded-pill";
        badge.innerHTML = '<i class="bi bi-info-circle me-1"></i> Default Active';
      }
    }
  } catch (err) {
    if (statusText) statusText.textContent = "Offline or Local Mode";
    if (badge) {
      badge.className = "badge bg-secondary text-white px-3 py-2 rounded-pill";
      badge.textContent = "Local";
    }
  }
}

window.toggleSecPasswordVisibility = function () {
  const input = document.getElementById("newMasterPassword");
  const icon = document.getElementById("toggleSecPassIcon");
  if (!input || !icon) return;
  if (input.type === "password") {
    input.type = "text";
    icon.className = "bi bi-eye-slash-fill";
  } else {
    input.type = "password";
    icon.className = "bi bi-eye-fill";
  }
};

window.checkNewPasswordStrength = function () {
  const pass = (document.getElementById("newMasterPassword")?.value || "").trim();
  const bar = document.getElementById("passStrengthBar");
  const label = document.getElementById("passStrengthLabel");
  const meterBox = document.getElementById("secStrengthMeterBox");

  if (!pass) {
    if (meterBox) meterBox.style.display = "none";
    return;
  }
  if (meterBox) meterBox.style.display = "block";

  const hasLength = pass.length >= 10;
  const hasUpper = /[A-Z]/.test(pass);
  const hasLower = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  updateBadgeState("chkLength", hasLength);
  updateBadgeState("chkUpper", hasUpper);
  updateBadgeState("chkLower", hasLower);
  updateBadgeState("chkNumber", hasNumber);
  updateBadgeState("chkSpecial", hasSpecial);

  let score = 0;
  if (pass.length >= 8) score++;
  if (hasLength) score++;
  if (hasUpper && hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  if (score <= 2) {
    if (bar) { bar.style.width = "25%"; bar.className = "progress-bar pass-strength-bar bg-danger"; }
    if (label) { label.textContent = "Weak"; label.className = "small fw-bold text-danger"; }
  } else if (score === 3) {
    if (bar) { bar.style.width = "50%"; bar.className = "progress-bar pass-strength-bar bg-warning"; }
    if (label) { label.textContent = "Medium"; label.className = "small fw-bold text-warning"; }
  } else if (score === 4) {
    if (bar) { bar.style.width = "75%"; bar.className = "progress-bar pass-strength-bar bg-info"; }
    if (label) { label.textContent = "Strong"; label.className = "small fw-bold text-info"; }
  } else {
    if (bar) { bar.style.width = "100%"; bar.className = "progress-bar pass-strength-bar bg-success"; }
    if (label) { label.textContent = "Very Strong"; label.className = "small fw-bold text-success"; }
  }
};

function updateBadgeState(id, isMet) {
  const el = document.getElementById(id);
  if (!el) return;
  const labelText = el.getAttribute("data-label") || el.textContent.trim().replace(/^.*? /, "");
  el.setAttribute("data-label", labelText);

  if (isMet) {
    el.className = "badge bg-success-subtle text-success border border-success-subtle";
    el.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i>${labelText}`;
  } else {
    el.className = "badge bg-light text-secondary border";
    el.innerHTML = `<i class="bi bi-circle me-1"></i>${labelText}`;
  }
}

window.generateAndSetStrongPassword = function () {
  const charsUpper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const charsLower = "abcdefghjkmnpqrstuvwxyz";
  const charsNum = "23456789";
  const charsSpecial = "!@#$%^&*()_+~=";
  const allChars = charsUpper + charsLower + charsNum + charsSpecial;

  let pass = "";
  pass += charsUpper[Math.floor(Math.random() * charsUpper.length)];
  pass += charsLower[Math.floor(Math.random() * charsLower.length)];
  pass += charsNum[Math.floor(Math.random() * charsNum.length)];
  pass += charsSpecial[Math.floor(Math.random() * charsSpecial.length)];

  for (let i = 4; i < 16; i++) {
    pass += allChars[Math.floor(Math.random() * allChars.length)];
  }

  pass = pass.split("").sort(() => 0.5 - Math.random()).join("");

  const input = document.getElementById("newMasterPassword");
  if (input) {
    input.value = pass;
    input.type = "text";
  }
  const icon = document.getElementById("toggleSecPassIcon");
  if (icon) icon.className = "bi bi-eye-slash-fill";
  checkNewPasswordStrength();

  navigator.clipboard.writeText(pass).catch(() => {});
  alert(`Strong password generated & copied to clipboard:\n\n${pass}\n\nClick "Save to Supabase Database" below to apply it.`);
};

window.saveNewAdminCredentials = async function () {
  const emailInput = document.getElementById("newAdminEmail");
  const passInput = document.getElementById("newMasterPassword");
  const saveBtn = document.getElementById("btnSaveAdminSec");

  const email = (emailInput?.value || "").trim().toLowerCase();
  const pass = (passInput?.value || "").trim();

  if (!email || !email.includes("@") || !email.includes(".")) {
    alert("Please enter a valid Admin Email address (e.g. admin@foxzen.com).");
    if (emailInput) emailInput.focus();
    return;
  }

  let newHash = null;
  if (pass.length > 0) {
    if (pass.length < 8) {
      alert("New password must be at least 8 characters long.");
      if (passInput) passInput.focus();
      return;
    }
    newHash = await computeSha256(pass);
  } else {
    // Keep existing hash
    const currentHashEl = document.getElementById("secCurrentHashDisplay");
    const existingVal = currentHashEl?.value || "";
    if (existingVal && existingVal.length === 64) {
      newHash = existingVal;
    } else {
      newHash = localStorage.getItem("foxzen_admin_hash") || "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b";
    }
  }

  // Visual saving indicator
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Saving to Supabase...';
  }

  try {
    let savedInSupabase = false;

    if (window.warrantyService && window.warrantyService.client) {
      const sb = window.warrantyService.client;

      // 1. Try RPC update_admin_credentials
      let { error: rpcErr } = await sb.rpc("update_admin_credentials", {
        new_email: email,
        new_hash: newHash
      });

      if (!rpcErr) {
        savedInSupabase = true;
      } else {
        // 2. Try RPC update_admin_password
        let { error: rpc2Err } = await sb.rpc("update_admin_password", {
          target_email: email,
          new_hash: newHash
        });

        if (!rpc2Err) {
          savedInSupabase = true;
        } else {
          // 3. Fallback table upsert
          const { error: upsertErr } = await sb.from("admin_credentials").upsert({
            id: "admin",
            email: email,
            password_hash: newHash,
            updated_at: new Date().toISOString()
          });
          if (!upsertErr) {
            savedInSupabase = true;
          }
        }
      }
    }

    localStorage.setItem("foxzen_admin_email", email);
    localStorage.setItem("foxzen_admin_hash", newHash);

    if (passInput) passInput.value = "";
    const meterBox = document.getElementById("secStrengthMeterBox");
    if (meterBox) meterBox.style.display = "none";

    await updateSecurityStatusUI();

    if (savedInSupabase) {
      alert(`Success! Admin credentials updated & saved in Supabase!\n\nEmail: ${email}\n${pass.length > 0 ? "Password: Updated successfully\n" : "Password: Kept existing password\n"}Hash: ${newHash}`);
    } else {
      alert(`Credentials updated locally!\nEmail: ${email}\nTo ensure it saves into Supabase, make sure Section 6 of supabase/schema.sql has been executed in your Supabase SQL editor.`);
    }
  } catch (err) {
    console.error("Save credentials error:", err);
    alert("Error updating credentials: " + err.message);
  } finally {
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-cloud-arrow-up-fill me-1"></i> Save to Supabase Database';
    }
  }
};

window.saveNewAdminPassword = window.saveNewAdminCredentials;

window.resetToDefaultPassword = async function () {
  if (!confirm("Are you sure you want to reset admin credentials to default?\n\nEmail: admin@foxzen.com\nPassword: admin123@verify")) {
    return;
  }

  const defaultEmail = "admin@foxzen.com";
  const defaultHash = "2bb80d537b1da3e38bd30361aa855686bde0eacd7162fef6a25fe97bf527a25b";

  try {
    if (window.warrantyService && window.warrantyService.client) {
      await window.warrantyService.client.from("admin_credentials").upsert({
        id: "admin",
        email: defaultEmail,
        password_hash: defaultHash,
        updated_at: new Date().toISOString()
      });
    }
  } catch (e) {}

  localStorage.removeItem("foxzen_admin_hash");
  localStorage.setItem("foxzen_admin_email", defaultEmail);

  const emailInput = document.getElementById("newAdminEmail");
  if (emailInput) emailInput.value = defaultEmail;
  const passInput = document.getElementById("newMasterPassword");
  if (passInput) passInput.value = "";

  await updateSecurityStatusUI();
  alert("Credentials successfully reset to default:\nEmail: admin@foxzen.com\nPassword: admin123@verify");
};

window.copySecHash = function () {
  const hash = document.getElementById("secCurrentHashDisplay")?.value || "";
  if (!hash || hash.includes("Loading") || hash.includes("No custom")) {
    alert("No custom hash available yet.");
    return;
  }

  navigator.clipboard.writeText(hash).then(() => {
    const btnText = document.getElementById("copySecHashBtnText");
    if (btnText) {
      btnText.textContent = "Copied!";
      setTimeout(() => { btnText.textContent = "Copy"; }, 2000);
    }
  });
};

window.copySecSql = function () {
  const sql = document.getElementById("secSqlSnippet")?.textContent?.trim() || "";
  if (!sql) return;

  navigator.clipboard.writeText(sql).then(() => {
    const btnText = document.getElementById("copySecSqlBtnText");
    if (btnText) {
      btnText.textContent = "Copied!";
      setTimeout(() => { btnText.textContent = "Copy SQL"; }, 2000);
    }
  });
};

// ===========================================================================
// SECTION 6: LEADS & CLIENT ENQUIRIES MANAGEMENT
// ===========================================================================

function formatLeadDate(dateStr) {
  if (!dateStr) return "N/A";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return (
      d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }) +
      ", " +
      d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    );
  } catch (e) {
    return dateStr;
  }
}

function getPlanBadgeClass(planName) {
  const p = (planName || "").toLowerCase();
  if (p.includes("monthly") || p.includes("99")) {
    return "bg-secondary";
  }
  if (p.includes("yearly") || p.includes("899")) {
    return "bg-primary";
  }
  if (p.includes("lifetime") || p.includes("9,999") || p.includes("9999")) {
    return "bg-dark text-warning border border-warning";
  }
  return "bg-info text-dark";
}

function updateLeadsKpiCards() {
  const totalEl = document.getElementById("leadStatTotal");
  const newEl = document.getElementById("leadStatNew");
  const contactedEl = document.getElementById("leadStatContacted");
  const convertedEl = document.getElementById("leadStatConverted");
  const badgeEl = document.getElementById("leadsNavBadge");

  const total = allLeads.length;
  const newCount = allLeads.filter(
    (l) => (l.status || "New").toLowerCase() === "new"
  ).length;
  const contactedCount = allLeads.filter(
    (l) => (l.status || "").toLowerCase() === "contacted"
  ).length;
  const convertedCount = allLeads.filter(
    (l) => (l.status || "").toLowerCase() === "converted"
  ).length;

  if (totalEl) totalEl.textContent = total;
  if (newEl) newEl.textContent = newCount;
  if (contactedEl) contactedEl.textContent = contactedCount;
  if (convertedEl) convertedEl.textContent = convertedCount;

  if (badgeEl) {
    if (newCount > 0) {
      badgeEl.textContent = newCount;
      badgeEl.classList.remove("d-none");
    } else {
      badgeEl.classList.add("d-none");
    }
  }
}

window.loadLeads = async function () {
  try {
    if (window.warrantyService && typeof window.warrantyService.getAllLeads === "function") {
      const res = await window.warrantyService.getAllLeads();
      allLeads = (res && res.data) ? res.data : (Array.isArray(res) ? res : []);
    } else {
      allLeads = [];
    }
  } catch (err) {
    console.error("Failed to load leads:", err);
    allLeads = [];
  }

  updateLeadsKpiCards();
  renderLeadsTable();
};

function generateLeadWhatsAppReplyUrl(lead) {
  const rawPhone = (lead.phone || "").replace(/\D/g, "");
  const phone = rawPhone.length === 10 ? "91" + rawPhone : rawPhone;
  const name = lead.first_name || lead.name || lead.full_name || "Client";
  const plan = lead.plan || lead.plan_interested || "License Setup";

  const message =
    `Hello ${name}! 👋\n\n` +
    `Thank you for your enquiry on VerifyMyWarranty regarding the *${plan}*.\n\n` +
    (lead.message ? `Regarding your requirement:\n"${lead.message}"\n\n` : "") +
    `We would love to help you get your automated warranty & license verification portal setup immediately.\n\n` +
    `Do you have any specific domain or questions before we get started?`;

  return `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
}

function generateLeadTelegramReplyUrl(lead) {
  const tg = (lead.telegram || "").replace(/^@/, "").trim();
  if (!tg) return null;
  return `https://t.me/${tg}`;
}

window.renderLeadsTable = function () {
  const tbody = document.getElementById("leadsTableBody");
  const emptyState = document.getElementById("emptyLeadsState");
  const searchInput = document.getElementById("leadsTableSearch");
  const statusFilterEl = document.getElementById("leadStatusFilter");

  if (!tbody) return;

  const query = (searchInput ? searchInput.value : "").toLowerCase().trim();
  const statusFilter = (statusFilterEl ? statusFilterEl.value : "").trim().toLowerCase();

  const filtered = allLeads.filter((lead) => {
    // 1. Status Filter
    if (statusFilter) {
      const st = (lead.status || "New").toLowerCase();
      if (st !== statusFilter) return false;
    }

    // 2. Query Search
    if (!query) return true;
    const name = (lead.name || lead.full_name || "").toLowerCase();
    const firstName = (lead.first_name || "").toLowerCase();
    const lastName = (lead.last_name || "").toLowerCase();
    const phone = (lead.phone || "").toLowerCase();
    const telegram = (lead.telegram || "").toLowerCase();
    const email = (lead.email || "").toLowerCase();
    const biz = (lead.business_name || "").toLowerCase();
    const plan = (lead.plan || lead.plan_interested || "").toLowerCase();
    const notes = (lead.message || lead.notes || "").toLowerCase();

    return (
      name.includes(query) ||
      firstName.includes(query) ||
      lastName.includes(query) ||
      phone.includes(query) ||
      telegram.includes(query) ||
      email.includes(query) ||
      biz.includes(query) ||
      plan.includes(query) ||
      notes.includes(query)
    );
  });

  if (filtered.length === 0) {
    tbody.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  let html = "";
  filtered.forEach((lead) => {
    const rawPhone = (lead.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? "91" + rawPhone : rawPhone;
    const waChatUrl = lead.phone ? generateLeadWhatsAppReplyUrl(lead) : null;
    const tgChatUrl = generateLeadTelegramReplyUrl(lead);
    const cleanTg = (lead.telegram || "").replace(/^@/, "").trim();
    const st = (lead.status || "New").toLowerCase();

    let statusBadgeColor = "secondary";
    if (st === "new") statusBadgeColor = "danger";
    else if (st === "contacted") statusBadgeColor = "warning";
    else if (st === "converted") statusBadgeColor = "success";
    else if (st === "closed") statusBadgeColor = "secondary";

    const leadName = lead.name || ((lead.first_name || "") + " " + (lead.last_name || "")).trim() || "N/A";
    const leadPlan = lead.plan || lead.plan_interested || "Custom";
    const leadAmount = (lead.amount !== undefined && lead.amount !== null && lead.amount !== "")
      ? lead.amount
      : (lead.plan_amount || 0);
    const leadNotes = lead.message || lead.notes || "";

    // Contact channels badges
    const contactBadges = [];
    if (lead.phone && lead.phone.trim()) {
      contactBadges.push(`
        <a href="https://wa.me/${cleanPhone}" target="_blank" class="badge bg-success bg-opacity-10 text-success border border-success-subtle text-decoration-none d-inline-flex align-items-center mb-1 me-1" title="Chat on WhatsApp">
          <i class="bi bi-whatsapp me-1"></i>${escapeHtml(lead.phone)}
        </a>
      `);
    }
    if (cleanTg) {
      contactBadges.push(`
        <a href="https://t.me/${cleanTg}" target="_blank" class="badge bg-info bg-opacity-10 text-primary border border-info-subtle text-decoration-none d-inline-flex align-items-center mb-1 me-1" title="Open Telegram">
          <i class="bi bi-telegram me-1"></i>@${escapeHtml(cleanTg)}
        </a>
      `);
    }
    if (lead.email && lead.email.trim()) {
      contactBadges.push(`
        <a href="mailto:${escapeHtml(lead.email)}" class="badge bg-secondary bg-opacity-10 text-dark border text-decoration-none d-inline-flex align-items-center mb-1 me-1" title="Send Email">
          <i class="bi bi-envelope me-1"></i>${escapeHtml(lead.email)}
        </a>
      `);
    }
    if (contactBadges.length === 0) {
      contactBadges.push(`<span class="text-muted small fst-italic">No contact info</span>`);
    }

    html += `
      <tr>
        <td>
          <div class="fw-bold text-dark">${escapeHtml(leadName)}</div>
          ${
            lead.business_name
              ? `<small class="text-primary d-block"><i class="bi bi-briefcase me-1"></i>${escapeHtml(
                  lead.business_name
                )}</small>`
              : ""
          }
        </td>

        <td>
          <div class="d-flex flex-wrap align-items-center">
            ${contactBadges.join("")}
          </div>
        </td>

        <td>
          <span class="badge ${getPlanBadgeClass(leadPlan)} px-2 py-1">
            ${escapeHtml(leadPlan)}
          </span>
          <div class="fw-bold text-dark mt-1">
            ${Number(leadAmount) > 0 ? `₹${Number(leadAmount).toLocaleString("en-IN")}` : "Custom"}
          </div>
        </td>

        <td>
          <div class="p-2 bg-light border rounded-3 small text-dark" style="max-width: 270px; min-width: 190px;">
            <div class="fw-medium text-truncate" title="${escapeHtml(leadNotes || 'No message provided')}">
              <i class="bi bi-chat-quote-fill text-primary me-1"></i>${escapeHtml(leadNotes || "No query message entered")}
            </div>
            <button type="button" class="btn btn-link btn-sm p-0 text-decoration-none text-primary fw-semibold mt-1" style="font-size: 0.76rem;" onclick="openLeadMessageModal('${lead.id}')">
              <i class="bi bi-eye-fill me-1"></i>Read Full Query
            </button>
          </div>
        </td>

        <td>
          <small class="text-muted font-monospace d-block">${formatLeadDate(lead.created_at)}</small>
        </td>

        <td>
          <select class="form-select form-select-sm fw-semibold border-${statusBadgeColor} text-${statusBadgeColor}" 
                  style="width: 125px; font-size: 0.82rem;"
                  onchange="updateLeadStatus('${lead.id}', this.value)">
            <option value="New" ${st === "new" ? "selected" : ""}>🔴 New</option>
            <option value="Contacted" ${st === "contacted" ? "selected" : ""}>🟡 Contacted</option>
            <option value="Converted" ${st === "converted" ? "selected" : ""}>🟢 Converted</option>
            <option value="Closed" ${st === "closed" ? "selected" : ""}>⚪ Closed</option>
          </select>
        </td>

        <td class="text-end">
          <div class="d-flex justify-content-end gap-1">
            ${
              waChatUrl
                ? `<a href="${waChatUrl}" target="_blank" class="btn btn-outline-success btn-sm rounded-pill px-2 shadow-sm" title="Chat on WhatsApp">
                    <i class="bi bi-whatsapp"></i>
                   </a>`
                : ""
            }
            ${
              tgChatUrl
                ? `<a href="${tgChatUrl}" target="_blank" class="btn btn-outline-info btn-sm rounded-pill px-2 shadow-sm text-primary" title="Open Telegram">
                    <i class="bi bi-telegram"></i>
                   </a>`
                : ""
            }
            <button type="button" class="btn btn-outline-primary btn-sm rounded-pill px-2 shadow-sm" onclick="openLeadMessageModal('${lead.id}')" title="View Full Query & Contact Info">
              <i class="bi bi-chat-left-text"></i>
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm rounded-circle" style="width: 32px; height: 32px; padding: 0;" onclick="deleteLeadRecord('${lead.id}')" title="Delete Lead">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tbody.innerHTML = html;
};

window.openLeadMessageModal = function (leadId) {
  const lead = allLeads.find((l) => String(l.id) === String(leadId));
  if (!lead) return;

  currentModalLeadId = leadId;

  const leadName = lead.name || ((lead.first_name || "") + " " + (lead.last_name || "")).trim() || "Client";
  const leadPlan = lead.plan || lead.plan_interested || "License Setup";
  const leadAmount = (lead.amount !== undefined && lead.amount !== null && lead.amount !== "")
    ? lead.amount
    : (lead.plan_amount || 0);
  const leadNotes = lead.message || lead.notes || "(No specific query entered)";

  const nameEl = document.getElementById("modalLeadName");
  const bizEl = document.getElementById("modalLeadBusiness");
  const planEl = document.getElementById("modalLeadPlanBadge");
  const amountEl = document.getElementById("modalLeadAmount");
  const dateEl = document.getElementById("modalLeadReceivedDate");
  const queryEl = document.getElementById("modalLeadQueryBody");
  const actionsEl = document.getElementById("modalLeadContactActions");
  const statusSelect = document.getElementById("modalLeadStatusSelect");

  if (nameEl) nameEl.textContent = leadName;
  if (bizEl) bizEl.textContent = lead.business_name ? `Store / Business: ${lead.business_name}` : "Individual Client";
  if (planEl) {
    planEl.textContent = leadPlan;
    planEl.className = `badge ${getPlanBadgeClass(leadPlan)} px-3 py-2 rounded-pill fs-6`;
  }
  if (amountEl) {
    amountEl.textContent = Number(leadAmount) > 0 ? `₹${Number(leadAmount).toLocaleString("en-IN")}` : "Custom Quote";
  }
  if (dateEl) dateEl.textContent = `Enquiry Received: ${formatLeadDate(lead.created_at)}`;
  if (queryEl) queryEl.textContent = leadNotes;

  if (statusSelect) {
    const st = (lead.status || "New").toLowerCase();
    for (let i = 0; i < statusSelect.options.length; i++) {
      if (statusSelect.options[i].value.toLowerCase() === st) {
        statusSelect.selectedIndex = i;
        break;
      }
    }
  }

  // Generate actionable contact buttons inside modal
  if (actionsEl) {
    const rawPhone = (lead.phone || "").replace(/\D/g, "");
    const cleanPhone = rawPhone.length === 10 ? "91" + rawPhone : rawPhone;
    const cleanTg = (lead.telegram || "").replace(/^@/, "").trim();
    const waUrl = lead.phone ? generateLeadWhatsAppReplyUrl(lead) : null;

    let actionsHtml = "";

    if (waUrl) {
      actionsHtml += `
        <a href="${waUrl}" target="_blank" class="btn btn-whatsapp py-2 px-3 rounded-pill fw-semibold shadow-sm d-flex justify-content-between align-items-center">
          <span><i class="bi bi-whatsapp me-2"></i>Reply via WhatsApp (${escapeHtml(lead.phone)})</span>
          <i class="bi bi-arrow-right"></i>
        </a>
      `;
    }

    if (cleanTg) {
      actionsHtml += `
        <a href="https://t.me/${cleanTg}" target="_blank" class="btn btn-outline-primary py-2 px-3 rounded-pill fw-semibold d-flex justify-content-between align-items-center">
          <span><i class="bi bi-telegram me-2 text-info"></i>Open Telegram Chat (@${escapeHtml(cleanTg)})</span>
          <i class="bi bi-box-arrow-up-right"></i>
        </a>
      `;
    }

    if (lead.email) {
      const emailSubj = encodeURIComponent(`Regarding your ${leadPlan} inquiry - VerifyMyWarranty`);
      const emailBody = encodeURIComponent(`Hello ${leadName},\n\nThank you for reaching out to us regarding ${leadPlan}...\n\nYour message: "${leadNotes}"`);
      actionsHtml += `
        <a href="mailto:${escapeHtml(lead.email)}?subject=${emailSubj}&body=${emailBody}" class="btn btn-outline-secondary py-2 px-3 rounded-pill fw-semibold d-flex justify-content-between align-items-center">
          <span><i class="bi bi-envelope me-2"></i>Send Email (${escapeHtml(lead.email)})</span>
          <i class="bi bi-send"></i>
        </a>
      `;
    }

    if (!actionsHtml) {
      actionsHtml = `<div class="text-muted small fst-italic p-2 bg-light rounded">No contact channel was provided in this enquiry.</div>`;
    }

    actionsEl.innerHTML = actionsHtml;
  }

  if (leadMessageModalInstance) {
    leadMessageModalInstance.show();
  } else {
    const m = bootstrap.Modal.getOrCreateInstance(document.getElementById("leadMessageModal"));
    m.show();
  }
};

window.onModalLeadStatusChange = async function (newStatus) {
  if (!currentModalLeadId) return;
  await window.updateLeadStatus(currentModalLeadId, newStatus);
};

window.updateLeadStatus = async function (leadId, newStatus) {
  try {
    if (window.warrantyService && typeof window.warrantyService.updateLeadStatus === "function") {
      await window.warrantyService.updateLeadStatus(leadId, newStatus);
    }

    const lead = allLeads.find((l) => String(l.id) === String(leadId));
    if (lead) {
      lead.status = newStatus;
    }

    updateLeadsKpiCards();
    renderLeadsTable();
  } catch (err) {
    console.error("Failed to update lead status:", err);
    alert("Could not update lead status. Please try again.");
  }
};

window.deleteLeadRecord = async function (leadId) {
  const lead = allLeads.find((l) => String(l.id) === String(leadId));
  const leadName = lead ? (lead.name || lead.full_name) : "this lead";

  if (!confirm(`Are you sure you want to delete the enquiry from "${leadName}"?`)) {
    return;
  }

  try {
    if (window.warrantyService && typeof window.warrantyService.deleteLead === "function") {
      await window.warrantyService.deleteLead(leadId);
    }

    allLeads = allLeads.filter((l) => String(l.id) !== String(leadId));
    updateLeadsKpiCards();
    renderLeadsTable();
  } catch (err) {
    console.error("Failed to delete lead:", err);
    alert("Could not delete lead. Please try again.");
  }
};

window.exportLeadsToCSV = function () {
  if (!allLeads || allLeads.length === 0) {
    alert("No leads available to export.");
    return;
  }

  const headers = [
    "Lead ID",
    "First Name",
    "Last Name",
    "Customer Name",
    "WhatsApp Phone",
    "Telegram Username",
    "Email",
    "Business / Store",
    "Interested Plan",
    "Amount (INR)",
    "Status",
    "Customer Query / Requirements",
    "Created Date"
  ];

  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = allLeads.map((l) => [
    escapeCSV(l.id),
    escapeCSV(l.first_name || ""),
    escapeCSV(l.last_name || ""),
    escapeCSV(l.name || l.full_name || ""),
    escapeCSV(l.phone || ""),
    escapeCSV(l.telegram || ""),
    escapeCSV(l.email || ""),
    escapeCSV(l.business_name || ""),
    escapeCSV(l.plan || l.plan_interested || ""),
    escapeCSV(l.amount !== undefined ? l.amount : (l.plan_amount || 0)),
    escapeCSV(l.status || "New"),
    escapeCSV(l.message || l.notes || ""),
    escapeCSV(l.created_at || "")
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `VerifyMyWarranty_Leads_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ===========================================================================
// DIARY & SECRET NOTES MANAGEMENT (Credentials, Calculations & Notes)
// ===========================================================================

async function loadDiaryNotes(badgeOnly = false) {
  try {
    const { data } = await window.warrantyService.getAllDiaryNotes();
    allDiaryNotes = data || [];
    updateDiaryBadge();
    if (!badgeOnly) {
      filterAndRenderDiary();
    }
  } catch (err) {
    console.error("Error loading diary notes:", err);
    if (!badgeOnly) {
      const grid = document.getElementById("diaryNotesGrid");
      if (grid) grid.innerHTML = `<div class="col-12 text-center py-4 text-danger">Failed to load diary notes.</div>`;
    }
  }
}

function updateDiaryBadge() {
  const badge = document.getElementById("diaryNavBadge");
  const countBadge = document.getElementById("diaryNotesCountBadge");
  const countAll = document.getElementById("diaryCountAll");
  const countCreds = document.getElementById("diaryCountCreds");
  const countCalc = document.getElementById("diaryCountCalc");
  const countGen = document.getElementById("diaryCountGen");
  const countPin = document.getElementById("diaryCountPin");

  const total = allDiaryNotes.length;
  const creds = allDiaryNotes.filter((n) => n.category === "credentials").length;
  const calc = allDiaryNotes.filter((n) => n.category === "calculations").length;
  const gen = allDiaryNotes.filter((n) => n.category === "general").length;
  const pin = allDiaryNotes.filter((n) => n.is_pinned).length;

  if (badge) {
    badge.textContent = total;
    badge.className = total > 0 ? "badge bg-danger rounded-pill ms-1" : "badge bg-secondary-subtle text-secondary rounded-pill ms-1 d-none";
  }
  if (countBadge) countBadge.textContent = `${total} Notes`;
  if (countAll) countAll.textContent = total;
  if (countCreds) countCreds.textContent = creds;
  if (countCalc) countCalc.textContent = calc;
  if (countGen) countGen.textContent = gen;
  if (countPin) countPin.textContent = pin;
}

window.filterDiaryCategory = function (category) {
  currentDiaryFilter = category;
  const btns = ["diaryCatAll", "diaryCatCreds", "diaryCatCalc", "diaryCatGen", "diaryCatPin"];
  btns.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  const catMap = {
    all: "diaryCatAll",
    credentials: "diaryCatCreds",
    calculations: "diaryCatCalc",
    general: "diaryCatGen",
    pinned: "diaryCatPin"
  };
  const activeId = catMap[category] || "diaryCatAll";
  document.getElementById(activeId)?.classList.add("active");

  filterAndRenderDiary();
};

window.filterDiaryNotes = function () {
  filterAndRenderDiary();
};

function filterAndRenderDiary() {
  const query = (document.getElementById("diarySearchInput")?.value || "").toLowerCase().trim();
  const grid = document.getElementById("diaryNotesGrid");
  const emptyState = document.getElementById("emptyDiaryState");
  if (!grid) return;

  let filtered = allDiaryNotes.filter((note) => {
    // Category filter
    if (currentDiaryFilter === "pinned") {
      if (!note.is_pinned) return false;
    } else if (currentDiaryFilter !== "all") {
      if (note.category !== currentDiaryFilter) return false;
    }

    // Search query
    if (query) {
      const matchTitle = (note.title || "").toLowerCase().includes(query);
      const matchUser = (note.username || "").toLowerCase().includes(query);
      const matchContent = (note.content || "").toLowerCase().includes(query);
      const matchSecret = (note.secret_key || "").toLowerCase().includes(query);
      return matchTitle || matchUser || matchContent || matchSecret;
    }
    return true;
  });

  // Sort: pinned first, then newest first
  filtered.sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (emptyState) emptyState.classList.remove("d-none");
    return;
  }

  if (emptyState) emptyState.classList.add("d-none");

  let html = "";
  filtered.forEach((note) => {
    const isCred = note.category === "credentials";
    const isCalc = note.category === "calculations";
    const categoryBadge = isCred
      ? `<span class="badge bg-danger-subtle text-danger border border-danger-subtle"><i class="bi bi-key-fill me-1"></i>Credentials</span>`
      : isCalc
      ? `<span class="badge bg-info-subtle text-info border border-info-subtle"><i class="bi bi-calculator-fill me-1"></i>Calculation</span>`
      : `<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle"><i class="bi bi-file-text me-1"></i>General Note</span>`;

    const noteDate = note.created_at ? new Date(note.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

    html += `
      <div class="col-md-6 col-xl-4">
        <div class="card h-100 diary-card shadow-sm ${note.is_pinned ? "is-pinned" : ""}">
          <div class="card-body p-3 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <div class="d-flex align-items-center gap-1">
                  ${categoryBadge}
                  ${note.is_pinned ? `<span class="badge bg-danger text-white"><i class="bi bi-pin-angle-fill"></i> Pinned</span>` : ""}
                </div>
                <div class="dropdown">
                  <button class="btn btn-sm btn-link text-muted p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="bi bi-three-dots-vertical fs-6"></i>
                  </button>
                  <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-3">
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" onclick="openEditDiaryNoteModal('${note.id}')">
                        <i class="bi bi-pencil me-2 text-primary"></i> Edit Note
                      </a>
                    </li>
                    <li>
                      <a class="dropdown-item py-2" href="javascript:void(0)" onclick="togglePinDiaryNote('${note.id}')">
                        <i class="bi bi-pin-angle me-2 text-warning"></i> ${note.is_pinned ? "Unpin Note" : "Pin to Top"}
                      </a>
                    </li>
                    <li><hr class="dropdown-divider my-1"></li>
                    <li>
                      <a class="dropdown-item py-2 text-danger" href="javascript:void(0)" onclick="deleteDiaryNoteRecord('${note.id}')">
                        <i class="bi bi-trash me-2"></i> Delete Note
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <h6 class="fw-bold text-dark mb-2">${escapeHtml(note.title)}</h6>

              ${note.username ? `
                <div class="p-2 rounded-2 bg-light mb-2 border d-flex justify-content-between align-items-center">
                  <div class="small text-truncate me-2">
                    <span class="text-muted d-block" style="font-size: 0.72rem;">LOGIN / USERNAME / UPI</span>
                    <strong class="font-monospace text-dark">${escapeHtml(note.username)}</strong>
                  </div>
                  <button class="btn btn-sm btn-light border py-0 px-2" title="Copy Username" onclick="copyDiaryText('${escapeHtml(note.username).replace(/'/g, "\\'")}', this)">
                    <i class="bi bi-clipboard"></i>
                  </button>
                </div>
              ` : ""}

              ${note.secret_key ? `
                <div class="p-2 rounded-2 bg-light mb-2 border d-flex justify-content-between align-items-center">
                  <div class="small text-truncate me-2">
                    <span class="text-muted d-block" style="font-size: 0.72rem;">PASSWORD / SECRET KEY</span>
                    <span id="secretVal_${note.id}" class="secret-mask-text font-monospace text-dark" data-secret="${escapeHtml(note.secret_key).replace(/"/g, '&quot;')}" data-shown="false">••••••••••••</span>
                  </div>
                  <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-light border py-0 px-2" title="Show/Hide" onclick="toggleSecretDisplay('${note.id}')">
                      <i class="bi bi-eye" id="secretEye_${note.id}"></i>
                    </button>
                    <button class="btn btn-sm btn-light border py-0 px-2" title="Copy Secret" onclick="copyDiaryText('${escapeHtml(note.secret_key).replace(/'/g, "\\'")}', this)">
                      <i class="bi bi-clipboard"></i>
                    </button>
                  </div>
                </div>
              ` : ""}

              ${note.content ? `
                <div class="p-2 bg-white rounded-2 border text-secondary font-monospace small mb-2" style="white-space: pre-wrap; max-height: 140px; overflow-y: auto; font-size: 0.82rem; line-height: 1.5;">${escapeHtml(note.content)}</div>
              ` : ""}
            </div>

            <div class="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
              <small class="text-muted" style="font-size: 0.75rem;"><i class="bi bi-clock me-1"></i>${noteDate}</small>
              <button class="btn btn-outline-secondary btn-sm py-0 px-2 rounded-pill" style="font-size: 0.75rem;" onclick="copyFullNote('${note.id}', this)">
                <i class="bi bi-clipboard-check me-1"></i>Copy Note
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  grid.innerHTML = html;
}

window.openAddDiaryNoteModal = function () {
  document.getElementById("diaryNoteModalTitle").innerHTML = `<i class="bi bi-journal-plus text-danger"></i> Add Note to Diary`;
  document.getElementById("editDiaryNoteId").value = "";
  document.getElementById("diaryNoteForm").reset();
  document.getElementById("diaryFormCategory").value = "credentials";
  document.getElementById("diaryFormPinned").checked = false;
  window.onDiaryCategoryChange();
  diaryNoteModalInstance.show();
};

window.openEditDiaryNoteModal = function (id) {
  const note = allDiaryNotes.find((n) => n.id === id);
  if (!note) return;

  document.getElementById("diaryNoteModalTitle").innerHTML = `<i class="bi bi-pencil-square text-danger"></i> Edit Diary Note`;
  document.getElementById("editDiaryNoteId").value = note.id;
  document.getElementById("diaryFormTitle").value = note.title || "";
  document.getElementById("diaryFormCategory").value = note.category || "general";
  document.getElementById("diaryFormUsername").value = note.username || "";
  document.getElementById("diaryFormSecret").value = note.secret_key || "";
  document.getElementById("diaryFormContent").value = note.content || "";
  document.getElementById("diaryFormPinned").checked = !!note.is_pinned;

  window.onDiaryCategoryChange();
  diaryNoteModalInstance.show();
};

window.onDiaryCategoryChange = function () {
  const cat = document.getElementById("diaryFormCategory").value;
  const credFields = document.getElementById("diaryCredFields");
  if (!credFields) return;
  if (cat === "credentials") {
    credFields.classList.remove("d-none");
  } else if (cat === "calculations") {
    credFields.classList.add("d-none");
  } else {
    credFields.classList.remove("d-none");
  }
};

window.toggleDiaryModalSecretVisibility = function () {
  const secretInput = document.getElementById("diaryFormSecret");
  const eyeIcon = document.getElementById("diarySecretEyeIcon");
  if (!secretInput || !eyeIcon) return;

  if (secretInput.type === "password") {
    secretInput.type = "text";
    eyeIcon.className = "bi bi-eye-slash";
  } else {
    secretInput.type = "password";
    eyeIcon.className = "bi bi-eye";
  }
};

window.toggleSecretDisplay = function (noteId) {
  const el = document.getElementById(`secretVal_${noteId}`);
  const eye = document.getElementById(`secretEye_${noteId}`);
  if (!el || !eye) return;

  const isShown = el.getAttribute("data-shown") === "true";
  const rawSecret = el.getAttribute("data-secret") || "";

  if (isShown) {
    el.textContent = "••••••••••••";
    el.setAttribute("data-shown", "false");
    eye.className = "bi bi-eye";
  } else {
    el.textContent = rawSecret;
    el.setAttribute("data-shown", "true");
    eye.className = "bi bi-eye-slash";
  }
};

window.copyDiaryText = function (text, btnEl) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    if (btnEl) {
      const origHtml = btnEl.innerHTML;
      btnEl.innerHTML = `<i class="bi bi-check2 text-success"></i>`;
      setTimeout(() => {
        btnEl.innerHTML = origHtml;
      }, 1500);
    }
  });
};

window.copyFullNote = function (noteId, btnEl) {
  const note = allDiaryNotes.find((n) => n.id === noteId);
  if (!note) return;

  let text = `📌 ${note.title}\n`;
  if (note.username) text += `👤 Login/UPI: ${note.username}\n`;
  if (note.secret_key) text += `🔑 Password/Secret: ${note.secret_key}\n`;
  if (note.content) text += `\n📝 Notes:\n${note.content}\n`;

  window.copyDiaryText(text.trim(), btnEl);
};

window.handleDiaryNoteSubmit = async function (e) {
  e.preventDefault();
  const id = document.getElementById("editDiaryNoteId").value;
  const saveBtn = document.getElementById("saveDiaryBtn");

  const noteData = {
    title: document.getElementById("diaryFormTitle").value.trim(),
    category: document.getElementById("diaryFormCategory").value,
    username: document.getElementById("diaryFormUsername").value.trim(),
    secret_key: document.getElementById("diaryFormSecret").value.trim(),
    content: document.getElementById("diaryFormContent").value.trim(),
    is_pinned: document.getElementById("diaryFormPinned").checked
  };

  saveBtn.disabled = true;
  saveBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Saving...`;

  try {
    if (id) {
      await window.warrantyService.updateDiaryNote(id, noteData);
    } else {
      await window.warrantyService.createDiaryNote(noteData);
    }
    diaryNoteModalInstance.hide();
    await loadDiaryNotes();
  } catch (err) {
    console.error("Save diary note error:", err);
    alert("Failed to save note: " + err.message);
  } finally {
    saveBtn.disabled = false;
    saveBtn.innerHTML = `<i class="bi bi-check2 me-1"></i> Save Note`;
  }
};

window.togglePinDiaryNote = async function (id) {
  const note = allDiaryNotes.find((n) => n.id === id);
  if (!note) return;
  try {
    await window.warrantyService.updateDiaryNote(id, { is_pinned: !note.is_pinned });
    await loadDiaryNotes();
  } catch (err) {
    console.error("Toggle pin note error:", err);
  }
};

window.deleteDiaryNoteRecord = async function (id) {
  if (!confirm("Are you sure you want to delete this diary note?")) return;
  try {
    await window.warrantyService.deleteDiaryNote(id);
    await loadDiaryNotes();
  } catch (err) {
    console.error("Delete diary note error:", err);
    alert("Failed to delete note: " + err.message);
  }
};



