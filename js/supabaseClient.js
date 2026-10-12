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

// Initial Seed Demo Leads / Enquiries
const DEFAULT_DEMO_LEADS = [
  {
    id: "lead-demo-1",
    name: "Vikram Malhotra",
    first_name: "Vikram",
    last_name: "Malhotra",
    phone: "+91 9876541230",
    telegram: "@vikram_malhotra",
    email: "vikram@techagency.in",
    plan: "Yearly Plan (₹899)",
    amount: 899.00,
    business_name: "TechAgency Solutions",
    message: "Interested in the yearly license setup for our digital products. Need custom branding and verification for 500+ licenses.",
    status: "new",
    source: "website_pricing",
    created_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: "lead-demo-2",
    name: "Ananya Deshmukh",
    first_name: "Ananya",
    last_name: "Deshmukh",
    phone: "+91 9812345678",
    telegram: "@ananya_gadgets",
    email: "ananya@gadgetzone.com",
    plan: "Lifetime Setup (₹9,999)",
    amount: 9999.00,
    business_name: "GadgetZone Retail",
    message: "Want full source code & lifetime license verification for our 5 retail branches. How soon can we deploy?",
    status: "contacted",
    source: "website_pricing",
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: "lead-demo-3",
    name: "Rajesh Kumar",
    first_name: "Rajesh",
    last_name: "Kumar",
    phone: "+91 9988776655",
    telegram: "",
    email: "rajesh@digitalkeys.store",
    plan: "Monthly Plan (₹99)",
    amount: 99.00,
    business_name: "DigitalKeys",
    message: "Testing license verification for our software tools. Looking for monthly starter.",
    status: "converted",
    source: "website_pricing",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString()
  }
];

// Initial Seed Diary Notes (Credentials & Calculations)
const DEFAULT_DEMO_DIARY_NOTES = [
  {
    id: "note-1",
    title: "Techshup OTT - Supplier Rates & UPI",
    category: "credentials",
    username: "techshup@okaxis",
    secret_key: "Vendor Mobile: +91 98765 43210",
    content: "Plan A: ₹70 (Sell @ ₹100)\nNetflix 1M: ₹180\nAlways ping on WhatsApp before buying bulk codes.",
    is_pinned: true,
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "note-2",
    title: "Monthly Reselling Math & Targets",
    category: "calculations",
    username: "",
    secret_key: "",
    content: "Target for this month:\n100 Plan A @ ₹30 margin = ₹3,000\n30 Canva Pro @ ₹150 margin = ₹4,500\n20 Own In-House Setups @ ₹899 = ₹17,980\nEstimated Net Profit: ~₹25,480",
    is_pinned: false,
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 12).toISOString()
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
    if (!localStorage.getItem("foxzen_diary_notes")) {
      localStorage.setItem("foxzen_diary_notes", JSON.stringify(DEFAULT_DEMO_DIARY_NOTES));
    }
  }

  getDemoDiaryNotes() {
    try {
      const data = localStorage.getItem("foxzen_diary_notes");
      return data ? JSON.parse(data) : DEFAULT_DEMO_DIARY_NOTES;
    } catch (e) {
      return DEFAULT_DEMO_DIARY_NOTES;
    }
  }

  saveDemoDiaryNotes(list) {
    localStorage.setItem("foxzen_diary_notes", JSON.stringify(list));
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
      let { data, error } = await this.client.from("products").insert([newProduct]).select();

      // If 'default_amount' or 'amount' column not yet in Supabase, retry with alternative or without it
      if (error && (error.message?.includes("default_amount") || error.message?.includes("amount") || error.code === "42703" || error.code === "PGRST204")) {
        // Try with only default_amount
        let fallback = { ...newProduct };
        delete fallback.amount;
        let retry = await this.client.from("products").insert([fallback]).select();
        if (!retry.error) {
          data = retry.data;
          error = null;
        } else {
          // Try with only amount
          fallback = { ...newProduct };
          delete fallback.default_amount;
          retry = await this.client.from("products").insert([fallback]).select();
          if (!retry.error) {
            data = retry.data;
            error = null;
          } else {
            // Try without any amount column
            delete fallback.amount;
            delete fallback.default_amount;
            retry = await this.client.from("products").insert([fallback]).select();
            if (!retry.error) {
              data = retry.data;
              error = null;
            }
          }
        }
      }

      if (error) {
        console.error("Supabase createProduct error:", error);
        // If table doesn't exist at all, save to local demo products
        if (error.code === "PGRST205" || error.message?.includes("products")) {
          newProduct.id = "prod-" + Date.now();
          const list = this.getDemoProducts();
          list.unshift(newProduct);
          this.saveDemoProducts(list);
          return { data: newProduct, error: null };
        }
        return { data: null, error };
      }
      return { data: data ? data[0] : null, error: null };
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
      let { data, error } = await this.client
        .from("products")
        .update(updates)
        .eq("id", id)
        .select();

      // If 'default_amount' or 'amount' column not yet migrated in Supabase, retry with alternative or without it
      if (error && (error.message?.includes("default_amount") || error.message?.includes("amount") || error.code === "42703" || error.code === "PGRST204")) {
        let fallback = { ...updates };
        delete fallback.amount;
        let retry = await this.client.from("products").update(fallback).eq("id", id).select();
        if (!retry.error) {
          data = retry.data;
          error = null;
        } else {
          fallback = { ...updates };
          delete fallback.default_amount;
          retry = await this.client.from("products").update(fallback).eq("id", id).select();
          if (!retry.error) {
            data = retry.data;
            error = null;
          } else {
            delete fallback.amount;
            delete fallback.default_amount;
            retry = await this.client.from("products").update(fallback).eq("id", id).select();
            if (!retry.error) {
              data = retry.data;
              error = null;
            }
          }
        }
      }

      if (error) {
        console.error("Supabase updateProduct error:", error);
        if (error.code === "PGRST205" || error.message?.includes("products")) {
          const list = this.getDemoProducts();
          const idx = list.findIndex((p) => p.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updates };
            this.saveDemoProducts(list);
            return { data: list[idx], error: null };
          }
        }
        return { data: null, error };
      }
      return { data: data ? data[0] : null, error: null };
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

      // Merge local vendor/cost enrichment if Supabase table didn't have those columns yet
      if (data && Array.isArray(data)) {
        const demoMap = {};
        this.getDemoRecords().forEach((d) => {
          if (d.id) demoMap[d.id] = d;
          if (d.serial_number) demoMap[d.serial_number] = d;
        });
        const enriched = data.map((item) => {
          const match = demoMap[item.id] || demoMap[item.serial_number];
          if (match) {
            return {
              source_type: item.source_type !== undefined ? item.source_type : (match.source_type || "own"),
              vendor_name: item.vendor_name !== undefined ? item.vendor_name : (match.vendor_name || ""),
              vendor_phone: item.vendor_phone !== undefined ? item.vendor_phone : (match.vendor_phone || ""),
              cost_price: item.cost_price !== undefined ? item.cost_price : (match.cost_price || 0),
              vendor_ref: item.vendor_ref !== undefined ? item.vendor_ref : (match.vendor_ref || ""),
              ...item
            };
          }
          return {
            source_type: item.source_type || "own",
            vendor_name: item.vendor_name || "",
            vendor_phone: item.vendor_phone || "",
            cost_price: item.cost_price || 0,
            vendor_ref: item.vendor_ref || "",
            ...item
          };
        });
        return { data: enriched, error: null };
      }
      return { data: data || [], error };
    } else {
      const list = this.getDemoRecords();
      return { data: list, error: null };
    }
  }

  async createWarranty(record) {
    const newRecord = {
      source_type: record.source_type || "own",
      vendor_name: record.vendor_name || "",
      vendor_phone: record.vendor_phone || "",
      cost_price: record.cost_price !== undefined ? parseFloat(record.cost_price) || 0 : 0,
      vendor_ref: record.vendor_ref || "",
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.isLive) {
      let { data, error } = await this.client.from("warranties").insert([newRecord]).select();

      // If new columns not yet migrated in Supabase, retry without them safely
      if (error && (
        error.message?.includes("amount") ||
        error.message?.includes("source_type") ||
        error.message?.includes("vendor_name") ||
        error.message?.includes("vendor_phone") ||
        error.message?.includes("cost_price") ||
        error.message?.includes("vendor_ref") ||
        error.code === "42703" ||
        error.code === "PGRST204"
      )) {
        const fallbackPayload = { ...newRecord };
        delete fallbackPayload.amount;
        delete fallbackPayload.source_type;
        delete fallbackPayload.vendor_name;
        delete fallbackPayload.vendor_phone;
        delete fallbackPayload.cost_price;
        delete fallbackPayload.vendor_ref;

        const retry = await this.client.from("warranties").insert([fallbackPayload]).select();
        if (!retry.error) {
          data = retry.data ? [{ ...newRecord, ...retry.data[0] }] : [newRecord];
          error = null;
        }
      }

      // Always maintain in local storage cache for instant offline & vendor sync
      const list = this.getDemoRecords();
      list.unshift(data && data[0] ? { ...newRecord, ...data[0] } : newRecord);
      this.saveDemoRecords(list);

      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        newRecord.id = "demo-" + Date.now();
        return { data: newRecord, error: null };
      }
      return { data: data ? data[0] : newRecord, error };
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

      // If new columns not yet migrated in Supabase, retry without them safely
      if (error && (
        error.message?.includes("amount") ||
        error.message?.includes("source_type") ||
        error.message?.includes("vendor_name") ||
        error.message?.includes("vendor_phone") ||
        error.message?.includes("cost_price") ||
        error.message?.includes("vendor_ref") ||
        error.code === "42703" ||
        error.code === "PGRST204"
      )) {
        const fallbackUpdates = { ...updates };
        delete fallbackUpdates.amount;
        delete fallbackUpdates.source_type;
        delete fallbackUpdates.vendor_name;
        delete fallbackUpdates.vendor_phone;
        delete fallbackUpdates.cost_price;
        delete fallbackUpdates.vendor_ref;

        const retry = await this.client.from("warranties").update(fallbackUpdates).eq("id", id).select();
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      // Always sync with local demo storage cache
      const list = this.getDemoRecords();
      const idx = list.findIndex((w) => w.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveDemoRecords(list);
      }

      if (error && (error.code === "PGRST205" || error.message?.includes("warranties"))) {
        return { data: list[idx] || null, error: null };
      }
      return { data: data ? data[0] : (list[idx] || null), error };
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

  // =========================================================================
  // LEADS & PORTAL ENQUIRIES MANAGEMENT
  // =========================================================================

  getDemoLeads() {
    try {
      const stored = localStorage.getItem("foxzen_demo_leads");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem("foxzen_demo_leads", JSON.stringify(DEFAULT_DEMO_LEADS));
      return DEFAULT_DEMO_LEADS;
    } catch (e) {
      return DEFAULT_DEMO_LEADS;
    }
  }

  saveDemoLeads(leads) {
    localStorage.setItem("foxzen_demo_leads", JSON.stringify(leads));
  }

  async getAllLeads() {
    if (this.isLive) {
      const { data, error } = await this.client
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return { data: this.getDemoLeads(), error: null };
      }
      return { data: data || [], error: null };
    } else {
      return { data: this.getDemoLeads(), error: null };
    }
  }

  async createLead(leadData) {
    const firstName = leadData.first_name || "";
    const lastName = leadData.last_name || "";
    const name = leadData.name || leadData.full_name || `${firstName} ${lastName}`.trim() || "Client";
    const telegram = leadData.telegram || "";
    const phone = leadData.phone || "";
    const email = leadData.email || "";
    const plan = leadData.plan || leadData.plan_interested || "Custom";
    const amount = Number(leadData.amount !== undefined ? leadData.amount : leadData.plan_amount || 0);
    const message = leadData.message || leadData.notes || "";

    const cleanPayload = {
      name: name,
      phone: phone,
      email: email,
      plan: plan,
      amount: amount,
      business_name: leadData.business_name || "",
      message: message,
      status: (leadData.status || "new").toLowerCase(),
      source: leadData.source || "website_pricing"
    };

    const localRecord = {
      ...cleanPayload,
      first_name: firstName,
      last_name: lastName,
      telegram: telegram,
      full_name: name,
      plan_interested: plan,
      plan_amount: amount,
      notes: message,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.isLive) {
      let insertData = { ...cleanPayload };
      if (telegram) insertData.telegram = telegram;
      if (firstName) insertData.first_name = firstName;
      if (lastName) insertData.last_name = lastName;

      let { data, error } = await this.client
        .from("leads")
        .insert([insertData])
        .select();

      // If custom columns don't exist in Supabase yet, retry with base columns
      if (error && (error.code === "42703" || error.message?.includes("column") || error.code === "PGRST204")) {
        const retry = await this.client
          .from("leads")
          .insert([cleanPayload])
          .select();
        if (!retry.error) {
          data = retry.data;
          error = null;
        }
      }

      if (error) {
        console.warn("Supabase createLead notice:", error);
        localRecord.id = "lead-loc-" + Date.now();
        const list = this.getDemoLeads();
        list.unshift(localRecord);
        this.saveDemoLeads(list);
        return { data: localRecord, error: null };
      }
      return { data: data ? data[0] : localRecord, error: null };
    } else {
      localRecord.id = "lead-loc-" + Date.now();
      const list = this.getDemoLeads();
      list.unshift(localRecord);
      this.saveDemoLeads(list);
      return { data: localRecord, error: null };
    }
  }

  async updateLeadStatus(id, newStatus) {
    if (this.isLive) {
      const { data, error } = await this.client
        .from("leads")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select();

      if (error) {
        const list = this.getDemoLeads();
        const idx = list.findIndex((l) => l.id === id);
        if (idx !== -1) {
          list[idx].status = newStatus;
          this.saveDemoLeads(list);
          return { data: list[idx], error: null };
        }
      }
      return { data: data ? data[0] : null, error };
    } else {
      const list = this.getDemoLeads();
      const idx = list.findIndex((l) => l.id === id);
      if (idx !== -1) {
        list[idx].status = newStatus;
        this.saveDemoLeads(list);
        return { data: list[idx], error: null };
      }
      return { data: null, error: { message: "Lead not found" } };
    }
  }

  async deleteLead(id) {
    if (this.isLive) {
      const { error } = await this.client.from("leads").delete().eq("id", id);
      if (error) {
        let list = this.getDemoLeads();
        list = list.filter((l) => l.id !== id);
        this.saveDemoLeads(list);
        return { error: null };
      }
      return { error };
    } else {
      let list = this.getDemoLeads();
      list = list.filter((l) => l.id !== id);
      this.saveDemoLeads(list);
      return { error: null };
    }
  }

  // =========================================================================
  // DIARY & SECRET NOTES MANAGEMENT (Credentials, Calculations & Notes)
  // =========================================================================

  async getAllDiaryNotes() {
    if (this.isLive) {
      const { data, error } = await this.client
        .from("diary_notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) {
        // Fallback to local storage if diary_notes table not yet created in Supabase
        return { data: this.getDemoDiaryNotes(), error: null };
      }
      return { data: data || [], error: null };
    } else {
      return { data: this.getDemoDiaryNotes(), error: null };
    }
  }

  async createDiaryNote(record) {
    const newRecord = {
      ...record,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.isLive) {
      const { data, error } = await this.client
        .from("diary_notes")
        .insert([newRecord])
        .select();

      if (error) {
        newRecord.id = "note-loc-" + Date.now();
        const list = this.getDemoDiaryNotes();
        list.unshift(newRecord);
        this.saveDemoDiaryNotes(list);
        return { data: newRecord, error: null };
      }
      return { data: data ? data[0] : newRecord, error: null };
    } else {
      newRecord.id = "note-loc-" + Date.now();
      const list = this.getDemoDiaryNotes();
      list.unshift(newRecord);
      this.saveDemoDiaryNotes(list);
      return { data: newRecord, error: null };
    }
  }

  async updateDiaryNote(id, updates) {
    updates.updated_at = new Date().toISOString();

    if (this.isLive) {
      const { data, error } = await this.client
        .from("diary_notes")
        .update(updates)
        .eq("id", id)
        .select();

      if (error) {
        const list = this.getDemoDiaryNotes();
        const idx = list.findIndex((n) => n.id === id);
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...updates };
          this.saveDemoDiaryNotes(list);
          return { data: list[idx], error: null };
        }
      }
      return { data: data ? data[0] : null, error };
    } else {
      const list = this.getDemoDiaryNotes();
      const idx = list.findIndex((n) => n.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...updates };
        this.saveDemoDiaryNotes(list);
        return { data: list[idx], error: null };
      }
      return { data: null, error: { message: "Note not found" } };
    }
  }

  async deleteDiaryNote(id) {
    if (this.isLive) {
      const { error } = await this.client.from("diary_notes").delete().eq("id", id);
      if (error) {
        let list = this.getDemoDiaryNotes();
        list = list.filter((n) => n.id !== id);
        this.saveDemoDiaryNotes(list);
        return { error: null };
      }
      return { error };
    } else {
      let list = this.getDemoDiaryNotes();
      list = list.filter((n) => n.id !== id);
      this.saveDemoDiaryNotes(list);
      return { error: null };
    }
  }
}

// Global instance
window.warrantyService = new WarrantyService();
