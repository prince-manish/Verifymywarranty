/**
 * VerifyMyWarranty / Foxzen - Supabase Client & Data Layer
 * Handles Supabase database queries with seamless demo fallback.
 */

// Generate dynamic dates for test data
const now = new Date();
const formatDateYMD = (d) => d.toISOString().split("T")[0];

const dateToday = formatDateYMD(now);

// Purchase date 12 months ago minus 2 days => expires in 2 days
const dateExpiring2Days = new Date(now);
dateExpiring2Days.setFullYear(dateExpiring2Days.getFullYear() - 1);
dateExpiring2Days.setDate(dateExpiring2Days.getDate() + 2);

// Purchase date 12 months ago minus 4 days => expires in 4 days
const dateExpiring4Days = new Date(now);
dateExpiring4Days.setFullYear(dateExpiring4Days.getFullYear() - 1);
dateExpiring4Days.setDate(dateExpiring4Days.getDate() + 4);

// Purchase date exactly 12 months ago => expires today
const dateExpiringToday = new Date(now);
dateExpiringToday.setFullYear(dateExpiringToday.getFullYear() - 1);

// Initial Seed Products
const DEFAULT_DEMO_PRODUCTS = [
  {
    id: "prod-1",
    name: "Foxzen License Pro 1-Year",
    default_warranty_months: 12,
    default_validity_months: 12,
    default_amount: 1499.00,
    duration_type: "month",
    description: "Annual subscription license for Foxzen Services with premium support",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-2",
    name: "Foxzen License Ultimate 2-Year",
    default_warranty_months: 24,
    default_validity_months: 24,
    default_amount: 2799.00,
    duration_type: "month",
    description: "Extended 2-year license with dedicated VIP account manager",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-3",
    name: "MacBook Pro 16\" M3 Max",
    default_warranty_months: 24,
    default_validity_months: 36,
    default_amount: 4999.00,
    duration_type: "month",
    description: "Apple hardware with extended warranty package",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-4",
    name: "Dell UltraSharp 27\" 4K Monitor",
    default_warranty_months: 12,
    default_validity_months: 12,
    default_amount: 899.00,
    duration_type: "month",
    description: "Professional color-accurate designer monitor",
    created_at: new Date().toISOString()
  },
  {
    id: "prod-5",
    name: "Sony WH-1000XM5 Headphones",
    default_warranty_months: 12,
    default_validity_months: 24,
    default_amount: 450.00,
    duration_type: "month",
    description: "Active noise cancelling wireless headphones",
    created_at: new Date().toISOString()
  }
];

// Initial Seed Warranties (including Expired Today, Expiring in 2 days, Expiring in 4 days)
const DEFAULT_DEMO_WARRANTIES = [
  {
    id: "demo-today",
    product_name: "Foxzen License Pro 1-Year",
    serial_number: "FXZ-EXP-TODAY",
    customer_name: "Rahul Verma",
    customer_email: "rahul.verma@example.com",
    customer_mobile: "+91 9876543210",
    telegram_id: "rahul_verma",
    purchase_date: formatDateYMD(dateExpiringToday),
    warranty_months: 12,
    warranty_type: "month",
    validity_months: 12,
    validity_type: "month",
    amount: 1499.00,
    status: "active",
    invoice_no: "INV-TODAY-001",
    notes: "Expiring today - renew urgently",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-2days",
    product_name: "Foxzen License Pro 1-Year",
    serial_number: "FXZ-EXP-2DAYS",
    customer_name: "Amit Sharma",
    customer_email: "amit.sharma@example.com",
    customer_mobile: "+91 9811223344",
    telegram_id: "amit_sharma",
    purchase_date: formatDateYMD(dateExpiring2Days),
    warranty_months: 12,
    warranty_type: "month",
    validity_months: 12,
    validity_type: "month",
    amount: 1499.00,
    status: "active",
    invoice_no: "INV-2DAYS-002",
    notes: "Expiring in 2 days",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-4days",
    product_name: "Foxzen License Ultimate 2-Year",
    serial_number: "FXZ-EXP-4DAYS",
    customer_name: "Neha Patel",
    customer_email: "neha.patel@example.com",
    customer_mobile: "+91 9822334455",
    telegram_id: "neha_patel",
    purchase_date: formatDateYMD(dateExpiring4Days),
    warranty_months: 12,
    warranty_type: "month",
    validity_months: 12,
    validity_type: "month",
    amount: 2799.00,
    status: "active",
    invoice_no: "INV-4DAYS-003",
    notes: "Expiring in 4 days",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-1",
    product_name: "MacBook Pro 16\" M3 Max",
    serial_number: "VMW-MBP-9921",
    customer_name: "John Doe",
    customer_email: "john.doe@example.com",
    customer_mobile: "+1 555-839-2019",
    telegram_id: "johndoe",
    purchase_date: "2026-06-15",
    warranty_months: 24,
    warranty_type: "month",
    validity_months: 36,
    validity_type: "month",
    amount: 4999.00,
    status: "active",
    invoice_no: "INV-2026-001",
    notes: "AppleCare+ Extended Support",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-2",
    product_name: "Dell UltraSharp 27\" 4K Monitor",
    serial_number: "VMW-DEL-4412",
    customer_name: "Sarah Connor",
    customer_email: "sarah.connor@example.com",
    customer_mobile: "+1 555-901-4433",
    telegram_id: "sarahconnor",
    purchase_date: "2024-05-10",
    warranty_months: 12,
    warranty_type: "month",
    validity_months: 12,
    validity_type: "month",
    amount: 899.00,
    status: "expired",
    invoice_no: "INV-2024-884",
    notes: "Standard manufacturer warranty",
    created_at: new Date().toISOString()
  }
];

class WarrantyService {
  constructor() {
    this.client = null;
    this.isLive = false;
    this.init();
  }

  init() {
    if (CONFIG.isConfigured() && window.supabase) {
      try {
        this.client = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
        this.isLive = true;
        console.log("Connected to Supabase live database.");
      } catch (err) {
        console.warn("Supabase init failed, falling back to local demo storage.", err);
        this.initDemoStorage();
      }
    } else {
      this.initDemoStorage();
    }
  }

  initDemoStorage() {
    this.isLive = false;
    if (!localStorage.getItem("vmw_demo_warranties")) {
      localStorage.setItem("vmw_demo_warranties", JSON.stringify(DEFAULT_DEMO_WARRANTIES));
    }
    if (!localStorage.getItem("vmw_demo_products")) {
      localStorage.setItem("vmw_demo_products", JSON.stringify(DEFAULT_DEMO_PRODUCTS));
    }
  }

  getDemoRecords() {
    try {
      const data = localStorage.getItem("vmw_demo_warranties");
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasFoxzen = parsed.some((r) => r.serial_number && r.serial_number.includes("FXZ-"));
          if (hasFoxzen) return parsed;
          const merged = [...DEFAULT_DEMO_WARRANTIES, ...parsed];
          localStorage.setItem("vmw_demo_warranties", JSON.stringify(merged));
          return merged;
        }
      }
      localStorage.setItem("vmw_demo_warranties", JSON.stringify(DEFAULT_DEMO_WARRANTIES));
      return DEFAULT_DEMO_WARRANTIES;
    } catch (e) {
      return DEFAULT_DEMO_WARRANTIES;
    }
  }

  saveDemoRecords(records) {
    localStorage.setItem("vmw_demo_warranties", JSON.stringify(records));
  }

  getDemoProducts() {
    try {
      const data = localStorage.getItem("vmw_demo_products");
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem("vmw_demo_products", JSON.stringify(DEFAULT_DEMO_PRODUCTS));
      return DEFAULT_DEMO_PRODUCTS;
    } catch (e) {
      return DEFAULT_DEMO_PRODUCTS;
    }
  }

  saveDemoProducts(products) {
    localStorage.setItem("vmw_demo_products", JSON.stringify(products));
  }

  // =========================================================================
  // PRODUCTS MANAGEMENT
  // =========================================================================

  async getAllProducts() {
    if (this.isLive) {
      const { data, error } = await this.client
        .from("products")
        .select("*")
        .order("name", { ascending: true });
      if (error) {
        // If table doesn't exist in Supabase yet, fallback gracefully to demo products
        return { data: this.getDemoProducts(), error: null };
      }
      return { data: data || [], error: null };
    } else {
      return { data: this.getDemoProducts(), error: null };
    }
  }

  async createProduct(product) {
    const newProduct = {
      ...product,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.isLive) {
      const { data, error } = await this.client.from("products").insert([newProduct]).select();
      if (error) {
        // Fallback to local storage if table missing
        newProduct.id = "prod-" + Date.now();
        const list = this.getDemoProducts();
        list.unshift(newProduct);
        this.saveDemoProducts(list);
        return { data: newProduct, error: null };
      }
      return { data: data ? data[0] : null, error };
    } else {
      newProduct.id = "prod-" + Date.now();
      const list = this.getDemoProducts();
      list.unshift(newProduct);
      this.saveDemoProducts(list);
      return { data: newProduct, error: null };
    }
  }

  async updateProduct(id, updates) {
    updates.updated_at = new Date().toISOString();

    if (this.isLive) {
      const { data, error } = await this.client
        .from("products")
        .update(updates)
        .eq("id", id)
        .select();
      if (error) {
        const list = this.getDemoProducts();
        const idx = list.findIndex((p) => p.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          this.saveDemoProducts(list);
          return { data: list[idx], error: null };
        }
      }
      return { data: data ? data[0] : null, error };
    } else {
      const list = this.getDemoProducts();
      const idx = list.findIndex((p) => p.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveDemoProducts(list);
        return { data: list[idx], error: null };
      }
      return { data: null, error: { message: "Product not found" } };
    }
  }

  async deleteProduct(id) {
    if (this.isLive) {
      const { error } = await this.client.from("products").delete().eq("id", id);
      if (error) {
        let list = this.getDemoProducts();
        list = list.filter((p) => p.id !== id);
        this.saveDemoProducts(list);
        return { error: null };
      }
      return { error };
    } else {
      let list = this.getDemoProducts();
      list = list.filter((p) => p.id !== id);
      this.saveDemoProducts(list);
      return { error: null };
    }
  }

  // =========================================================================
  // USER WARRANTIES & LICENSES
  // =========================================================================

  async searchWarranty(query) {
    const raw = query.trim();
    const cleanLower = raw.toLowerCase();
    const digitsOnly = raw.replace(/\D/g, "");

    if (this.isLive) {
      try {
        const { data: rpcData, error: rpcError } = await this.client.rpc("search_warranty", {
          query_text: raw
        });
        if (!rpcError && rpcData && rpcData.length > 0) {
          return { data: rpcData, error: null };
        }
      } catch (e) {
        // RPC fallback
      }

      const { data, error } = await this.client
        .from("warranties")
        .select("*")
        .or(
          `serial_number.ilike.%${raw}%,customer_email.ilike.%${raw}%,customer_mobile.ilike.%${raw}%`
        )
        .limit(10);

      if (!error && data && data.length > 0) {
        return { data: data, error: null };
      }

      // Fallback to local demo records if Supabase table is missing or empty
      const list = this.getDemoRecords();
      const matched = list.filter((item) => {
        const serialMatch = item.serial_number && item.serial_number.toLowerCase() === cleanLower;
        const emailMatch = item.customer_email && item.customer_email.trim() !== "" && item.customer_email.toLowerCase() === cleanLower;
        const phoneDigits = (item.customer_mobile || "").replace(/\D/g, "");
        const mobileMatch =
          item.customer_mobile &&
          item.customer_mobile.trim() !== "" &&
          (item.customer_mobile.toLowerCase().includes(cleanLower) ||
            (digitsOnly.length >= 6 && phoneDigits.includes(digitsOnly)));
        const tgMatch =
          item.telegram_id &&
          item.telegram_id.trim() !== "" &&
          item.telegram_id.toLowerCase().replace(/^@/, "") === cleanLower.replace(/^@/, "");

        return serialMatch || emailMatch || mobileMatch || tgMatch;
      });

      if (matched.length > 0) {
        return { data: matched, error: null };
      }

      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        return { data: [], error };
      }

      return { data: data || [], error: null };
    } else {
      const list = this.getDemoRecords();
      const matched = list.filter((item) => {
        const serialMatch = item.serial_number && item.serial_number.toLowerCase() === cleanLower;
        const emailMatch = item.customer_email && item.customer_email.trim() !== "" && item.customer_email.toLowerCase() === cleanLower;
        const phoneDigits = (item.customer_mobile || "").replace(/\D/g, "");
        const mobileMatch =
          item.customer_mobile &&
          item.customer_mobile.trim() !== "" &&
          (item.customer_mobile.toLowerCase().includes(cleanLower) ||
            (digitsOnly.length >= 6 && phoneDigits.includes(digitsOnly)));
        const tgMatch =
          item.telegram_id &&
          item.telegram_id.trim() !== "" &&
          item.telegram_id.toLowerCase().replace(/^@/, "") === cleanLower.replace(/^@/, "");

        return serialMatch || emailMatch || mobileMatch || tgMatch;
      });

      return { data: matched, error: null };
    }
  }

  async getAllWarranties() {
    if (this.isLive) {
      const { data, error } = await this.client
        .from("warranties")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        return { data: this.getDemoRecords(), error: null };
      }
      return { data: data || [], error };
    } else {
      const list = this.getDemoRecords();
      return { data: list, error: null };
    }
  }

  async createWarranty(record) {
    const newRecord = {
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.isLive) {
      let { data, error } = await this.client.from("warranties").insert([newRecord]).select();

      // If 'amount' column not yet migrated in Supabase, retry without amount column safely
      if (error && (error.message?.includes("amount") || error.code === "42703" || error.code === "PGRST204")) {
        const fallbackPayload = { ...newRecord };
        delete fallbackPayload.amount;
        const retry = await this.client.from("warranties").insert([fallbackPayload]).select();
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        newRecord.id = "demo-" + Date.now();
        const list = this.getDemoRecords();
        list.unshift(newRecord);
        this.saveDemoRecords(list);
        return { data: newRecord, error: null };
      }
      return { data: data ? data[0] : null, error };
    } else {
      newRecord.id = "demo-" + Date.now();
      const list = this.getDemoRecords();
      list.unshift(newRecord);
      this.saveDemoRecords(list);
      return { data: newRecord, error: null };
    }
  }

  async updateWarranty(id, updates) {
    updates.updated_at = new Date().toISOString();

    if (this.isLive) {
      let { data, error } = await this.client
        .from("warranties")
        .update(updates)
        .eq("id", id)
        .select();

      // If 'amount' column not yet migrated in Supabase, retry without amount column safely
      if (error && (error.message?.includes("amount") || error.code === "42703" || error.code === "PGRST204")) {
        const fallbackUpdates = { ...updates };
        delete fallbackUpdates.amount;
        const retry = await this.client.from("warranties").update(fallbackUpdates).eq("id", id).select();
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        const list = this.getDemoRecords();
        const idx = list.findIndex((w) => w.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          this.saveDemoRecords(list);
          return { data: list[idx], error: null };
        }
      }
      return { data: data ? data[0] : null, error };
    } else {
      const list = this.getDemoRecords();
      const idx = list.findIndex((w) => w.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveDemoRecords(list);
        return { data: list[idx], error: null };
      }
      return { data: null, error: { message: "Record not found" } };
    }
  }

  async deleteWarranty(id) {
    if (this.isLive) {
      const { error } = await this.client.from("warranties").delete().eq("id", id);
      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        let list = this.getDemoRecords();
        list = list.filter((w) => w.id !== id);
        this.saveDemoRecords(list);
        return { error: null };
      }
      return { error };
    } else {
      let list = this.getDemoRecords();
      list = list.filter((w) => w.id !== id);
      this.saveDemoRecords(list);
      return { error: null };
    }
  }

  async bulkImport(records) {
    if (this.isLive) {
      const { data, error } = await this.client.from("warranties").insert(records);
      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        const list = this.getDemoRecords();
        const formatted = records.map((r, i) => ({
          ...r,
          id: "demo-csv-" + Date.now() + "-" + i,
          created_at: new Date().toISOString()
        }));
        this.saveDemoRecords([...formatted, ...list]);
        return { count: records.length, error: null };
      }
      return { count: data ? data.length : records.length, error };
    } else {
      const list = this.getDemoRecords();
      const formatted = records.map((r, i) => ({
        ...r,
        id: "demo-csv-" + Date.now() + "-" + i,
        created_at: new Date().toISOString()
      }));
      this.saveDemoRecords([...formatted, ...list]);
      return { count: records.length, error: null };
    }
  }
}

// Global instance
window.warrantyService = new WarrantyService();
