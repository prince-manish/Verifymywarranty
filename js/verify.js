/**
 * VerifyMyWarranty - Public Verification Logic
 * Handles customer search by Serial Number, Email, and Mobile Number.
 */

document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("warrantyForm");
  const searchInput = document.getElementById("searchInput");
  const resultContainer = document.getElementById("resultContainer");
  const actionButtons = document.getElementById("actionButtons");
  const searchTypeTabs = document.querySelectorAll("#searchTabs button");
  const demoBanner = document.getElementById("demoBanner");

  // Show demo pill if Supabase is not yet configured
  if (demoBanner && !CONFIG.isConfigured()) {
    demoBanner.style.display = "inline-flex";
  }

  // Handle Tab Switching (Placeholder helper)
  let currentSearchType = "all";
  searchTypeTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      searchTypeTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      currentSearchType = this.getAttribute("data-type");

      if (currentSearchType === "serial") {
        searchInput.placeholder = "e.g. VMW-MBP-9921";
      } else if (currentSearchType === "email") {
        searchInput.placeholder = "e.g. customer@example.com";
      } else if (currentSearchType === "mobile") {
        searchInput.placeholder = "e.g. +1 555-839-2019 or 9876543210";
      } else {
        searchInput.placeholder = "Enter Serial Number, Email, or Mobile...";
      }
      searchInput.focus();
    });
  });

  // Handle Form Submission
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const query = searchInput.value.trim();

    if (!query) {
      searchInput.focus();
      return;
    }

    // Show Loading Spinner
    resultContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
        <p class="mt-3 text-muted fw-semibold mb-0">Searching warranty records...</p>
      </div>
    `;
    actionButtons.style.display = "none";

    try {
      const { data, error } = await window.warrantyService.searchWarranty(query);

      if (error) {
        console.error("Search error:", error);
        let errorMsg = "Unable to connect to database. Please verify your connection or try again.";
        if (error.code === "PGRST205" || (error.message && error.message.includes("warranties"))) {
          errorMsg = `<strong>Database Table Not Created Yet!</strong><br>Please copy the code from <code>supabase/schema.sql</code> and click <strong>Run</strong> in your Supabase SQL Editor to create the warranties table.`;
        }
        resultContainer.innerHTML = `
          <div class="alert alert-warning text-center mt-3 shadow-sm py-3">
            <i class="bi bi-database-exclamation fs-4 d-block mb-2 text-warning"></i>
            <div>${errorMsg}</div>
          </div>
        `;
        return;
      }

      if (!data || data.length === 0) {
        resultContainer.innerHTML = `
          <div class="alert alert-warning text-center mt-3 shadow-sm py-4">
            <i class="bi bi-search display-6 d-block mb-2 text-warning"></i>
            <h5 class="fw-bold mb-1">No Warranty Found</h5>
            <p class="text-muted small mb-0">
              No matching record was found for <strong>${escapeHtml(query)}</strong>.
              <br>Please check your Serial Number, registered Email, or Mobile Number.
            </p>
          </div>
        `;
        actionButtons.style.display = "block";
        return;
      }

      // Display found results (supports multiple if customer owns multiple products)
      renderResults(data);
      actionButtons.style.display = "block";
    } catch (err) {
      console.error("Unexpected error:", err);
      resultContainer.innerHTML = `
        <div class="alert alert-danger text-center mt-3 shadow-sm">
          <i class="bi bi-x-circle me-2"></i>
          An unexpected error occurred. Please try again later.
        </div>
      `;
    }
  });

  // Reset Function
  window.resetSearch = function () {
    searchInput.value = "";
    resultContainer.innerHTML = "";
    actionButtons.style.display = "none";
    searchInput.focus();
  };
});

/**
 * Render Search Results
 */
function renderResults(records) {
  const container = document.getElementById("resultContainer");
  let html = "";

  records.forEach((product, idx) => {
    const purchaseDate = new Date(product.purchase_date);
    const today = new Date();

    // Calculate Warranty Expiry
    const warrantyExpiry = calculateExpiry(
      purchaseDate,
      product.warranty_months,
      product.warranty_type || "month"
    );
    const isWarrantyActive = today <= warrantyExpiry && product.status !== "void";
    const daysWarrantyLeft = Math.ceil((warrantyExpiry - today) / (1000 * 60 * 60 * 24));

    // Calculate Validity Expiry
    const validityExpiry = calculateExpiry(
      purchaseDate,
      product.validity_months || product.warranty_months,
      product.validity_type || "month"
    );
    const isValidityActive = today <= validityExpiry && product.status !== "void";

    // Privacy Masking
    const maskedEmail = maskEmail(product.customer_email || "");
    const maskedMobile = maskMobile(product.customer_mobile || "");

    // Overall Status
    let statusClass = "status-active";
    let statusIcon = "bi-patch-check-fill";
    let statusText = "Active & Verified";

    if (product.status === "void") {
      statusClass = "status-void";
      statusIcon = "bi-slash-circle-fill";
      statusText = "Warranty Voided / Suspended";
    } else if (!isWarrantyActive && !isValidityActive) {
      statusClass = "status-expired";
      statusIcon = "bi-x-octagon-fill";
      statusText = "Warranty Expired";
    } else if (daysWarrantyLeft <= 30 && daysWarrantyLeft > 0) {
      statusClass = "status-expiring";
      statusIcon = "bi-exclamation-circle-fill";
      statusText = `Expiring Soon (${daysWarrantyLeft} days left)`;
    }

    html += `
      <div class="card border-0 shadow-sm mb-4 ${idx > 0 ? "mt-4 pt-3 border-top" : ""}">
        <div class="result-status-banner ${statusClass}">
          <i class="bi ${statusIcon} fs-5"></i>
          <span>${statusText}</span>
        </div>

        <div class="px-3 pb-3">
          <div class="text-center mb-3">
            <h4 class="fw-bold text-primary mb-1">${escapeHtml(product.product_name)}</h4>
            <span class="badge bg-light text-dark border px-3 py-1 font-monospace">
              <i class="bi bi-upc-scan me-1"></i> SN: ${escapeHtml(product.serial_number)}
            </span>
          </div>

          <div class="warranty-detail-card p-3">
            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-shield-check me-1 text-primary"></i> Hardware Warranty:</span>
              <span class="warranty-val ${isWarrantyActive ? "text-success" : "text-danger"}">
                ${formatDate(warrantyExpiry)} 
                <span class="badge ${isWarrantyActive ? "bg-success" : "bg-danger"} ms-1">
                  ${isWarrantyActive ? "Active" : "Expired"}
                </span>
              </span>
            </div>

            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-cpu me-1 text-info"></i> Software / Validity:</span>
              <span class="warranty-val ${isValidityActive ? "text-primary" : "text-danger"}">
                ${formatDate(validityExpiry)}
                <span class="badge ${isValidityActive ? "bg-primary" : "bg-danger"} ms-1">
                  ${isValidityActive ? "Active" : "Expired"}
                </span>
              </span>
            </div>

            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-calendar3 me-1"></i> Purchase Date:</span>
              <span class="warranty-val">${formatDate(purchaseDate)}</span>
            </div>

            ${
              product.customer_name && product.customer_name !== "Customer"
                ? `
            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-person me-1"></i> Registered To:</span>
              <span class="warranty-val">${escapeHtml(product.customer_name)}</span>
            </div>`
                : ""
            }

            ${
              product.customer_email && product.customer_email.trim()
                ? `
            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-envelope me-1"></i> Registered Email:</span>
              <span class="warranty-val font-monospace">${escapeHtml(maskedEmail)}</span>
            </div>`
                : ""
            }

            ${
              product.customer_mobile && product.customer_mobile.trim()
                ? `
            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-phone me-1"></i> Registered Mobile:</span>
              <span class="warranty-val font-monospace">${escapeHtml(maskedMobile)}</span>
            </div>`
                : ""
            }

            ${
              product.telegram_id && product.telegram_id.trim()
                ? `
            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-telegram me-1"></i> Telegram:</span>
              <span class="warranty-val font-monospace">@${escapeHtml(product.telegram_id.replace(/^@/, ""))}</span>
            </div>`
                : ""
            }

            ${
              product.invoice_no
                ? `
            <div class="warranty-detail-row">
              <span class="warranty-label"><i class="bi bi-receipt me-1"></i> Invoice Reference:</span>
              <span class="warranty-val">${escapeHtml(product.invoice_no)}</span>
            </div>
            `
                : ""
            }
          </div>

          <div class="text-center mt-3">
            <button class="btn btn-outline-primary btn-sm rounded-pill px-3" onclick="openCertificateModal(${JSON.stringify(
              product
            ).replace(/"/g, "&quot;")})">
              <i class="bi bi-award me-1"></i> View & Print Warranty Certificate
            </button>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/**
 * Calculate expiry date from start date and duration
 */
function calculateExpiry(startDate, duration, type) {
  const expiry = new Date(startDate);
  const dur = parseInt(duration, 10) || 0;
  if (type === "day") {
    expiry.setDate(expiry.getDate() + dur);
  } else {
    // month
    expiry.setMonth(expiry.getMonth() + dur);
  }
  return expiry;
}

/**
 * Mask Phone for privacy: 9876543210 -> 98****3210
 */
function maskMobile(phone) {
  if (!phone) return "N/A";
  const str = String(phone).trim();
  if (str.length <= 4) return str;
  if (str.length <= 8) {
    return str.slice(0, 2) + "****" + str.slice(-2);
  }
  return str.slice(0, 3) + "****" + str.slice(-3);
}

/**
 * Mask Email for privacy: john.doe@example.com -> j***e@example.com
 */
function maskEmail(email) {
  if (!email || !email.includes("@")) return "N/A";
  const parts = email.split("@");
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) {
    return name[0] + "***@" + domain;
  }
  return name[0] + "***" + name[name.length - 1] + "@" + domain;
}

/**
 * Format Date to "15 Oct 2026"
 */
function formatDate(date) {
  if (!(date instanceof Date) || isNaN(date)) return "N/A";
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
}

/**
 * Escape HTML
 */
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Open Certificate Modal
 */
window.openCertificateModal = function (product) {
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
            ${isWActive ? "WARRANTY VALID" : "WARRANTY EXPIRED"}
          </span>
        </div>
      </div>

      <h3 class="fw-bold mb-1">${escapeHtml(product.product_name)}</h3>
      <p class="text-muted mb-4 font-monospace">Serial Number: <strong>${escapeHtml(
        product.serial_number
      )}</strong></p>

      <div class="row text-start g-3 mb-4 bg-light p-3 rounded">
        <div class="col-6">
          <small class="text-muted d-block">Registered Customer</small>
          <strong>${escapeHtml(product.customer_name)}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Purchase Date</small>
          <strong>${formatDate(pDate)}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Warranty Expiry Date</small>
          <strong class="${isWActive ? "text-success" : "text-danger"}">${formatDate(wExp)}</strong>
        </div>
        <div class="col-6">
          <small class="text-muted d-block">Invoice / Reference</small>
          <strong>${escapeHtml(product.invoice_no || "N/A")}</strong>
        </div>
      </div>

      <div class="d-flex justify-content-between align-items-center pt-3 border-top text-muted small">
        <span>Verified via Foxzen Portal</span>
        <span>Certificate ID: ${product.id || "VMW-" + Date.now()}</span>
      </div>
    </div>
  `;

  document.getElementById("certificateModalBody").innerHTML = certHtml;
  const modal = new bootstrap.Modal(document.getElementById("certificateModal"));
  modal.show();
};
