# VerifyMyWarranty - Customer Verification & Admin Portal

A modern, responsive warranty and product verification website inspired by [verifymywarranty.com](https://www.verifymywarranty.com/), powered by **Supabase** (PostgreSQL) and vanilla web standards (HTML5, Bootstrap 5, JavaScript).

---

## 🚀 Key Features

1. **Multi-Identifier Customer Search**:
   - Customers can look up their warranty status using **Serial Number**, **Email Address**, OR **Mobile Number** (supports formatted or unformatted digits).
   - Real-time hardware warranty & software license validity countdowns.
   - Privacy-first data masking (masks customer mobile `98****3210` and email `j***e@domain.com`).
   - Official printable warranty verification certificate/slip.

2. **Admin Management Suite (`/admin`)**:
   - Secure login with master password or Supabase Auth.
   - Live Dashboard statistics: Total Warranties, Active Warranties, Expired Warranties, Expiring in 30 Days.
   - Full CRUD: Add new warranties, edit existing records, delete entries.
   - Bulk CSV Import with live preview table and sample template generator.
   - One-click CSV Export.
   - Certificate generator for administrative reprint.

3. **Zero-Configuration Instant Preview**:
   - Out of the box, the app runs in **Demo Mode** with pre-seeded mock records and full local persistence, allowing you to test searching, adding, editing, and CSV importing right in your browser!
   - Once you plug in your Supabase credentials, it automatically connects to your live Supabase PostgreSQL database.

---

## 📁 File Structure

```text
project 2/
├── index.html               # Public Customer Verification Portal
├── css/
│   └── style.css            # Custom CSS & print certificate styles
├── js/
│   ├── config.js            # Supabase API keys & application configuration
│   ├── supabaseClient.js    # Supabase Client SDK & data operations
│   ├── verify.js            # Customer search, privacy masking & certificate logic
│   └── admin.js             # Admin statistics, CRUD, CSV import/export
├── admin/
│   ├── index.html           # Admin Dashboard & Warranty Manager
│   └── login.html           # Admin Authentication Page
├── supabase/
│   └── schema.sql           # PostgreSQL table schema, indexes, RLS, and seed data
└── README.md                # Documentation and setup guide
```

---

## 🛠️ Supabase Setup (3 Easy Steps)

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com/) and click **New Project**.
2. Set your project name and database password.

### Step 2: Run Database Schema
1. In your Supabase dashboard, go to the **SQL Editor** tab on the left.
2. Open `supabase/schema.sql` from this folder, copy all contents, paste it into the SQL Editor, and click **Run**.
3. This creates:
   - `warranties` table with proper data types.
   - High-speed B-Tree indexes on `serial_number`, `customer_email`, and `customer_mobile`.
   - Row Level Security (RLS) policies allowing public verification queries.
   - Sample test records.

### Step 3: Add Your API Keys to `js/config.js`
1. In your Supabase dashboard, go to **Project Settings** (gear icon) -> **API**.
2. Copy:
   - **Project URL**
   - **Project API Keys -> `anon` `public`**
3. Open `js/config.js` in your editor and update:
   ```javascript
   const CONFIG = {
     SUPABASE_URL: "https://your-project-id.supabase.co",
     SUPABASE_ANON_KEY: "your-anon-public-key-here",
     ...
   };
   ```

---

## 🧪 Testing Sample Data

You can immediately test the portal with these pre-configured sample records:

| Search Query | Identifier Type | Expected Result |
| :--- | :--- | :--- |
| `VMW-MBP-9921` | Serial Number | MacBook Pro 16" (Active) |
| `john.doe@example.com` | Customer Email | MacBook Pro 16" (Active) |
| `+1 555-839-2019` or `8392019` | Mobile Number | MacBook Pro 16" (Active) |
| `VMW-DEL-4412` | Serial Number | Dell Monitor (Expired) |
| `david.miller@example.com` | Customer Email | Sony Headphones (Active) |
| `9876543210` | Mobile Number | iPhone 16 Pro Max (Active) |

---

## 🔐 Admin Access

- **URL**: Navigate to `admin/login.html` (or click "Admin Login" on the top right of the home page).
- **Default Password**: `admin123@verify` (click the demo code on the login page to auto-fill).
