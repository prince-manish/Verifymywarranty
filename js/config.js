/**
 * VerifyMyWarranty / Foxzen - Supabase & Application Configuration
 *
 * NOTE: For maximum security, NO passwords or secret credentials are saved in code.
 * All admin credentials are securely stored and verified in Supabase!
 */

const CONFIG = {
  // Supabase Project Credentials:
  SUPABASE_URL: "https://efqxpvtcqrubekhbngmm.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_oveNoxNg2XJw60bR_uZPKA_bad_HZXQ",

  // Admin Portal Session Identifier
  ADMIN_SESSION_KEY: "foxzen_admin_session",

  // App Meta
  APP_NAME: "Foxzen / VerifyMyWarranty",
  SUPPORT_EMAIL: "support@foxzen.com",

  // Returns true if Supabase credentials have been configured
  isConfigured: function () {
    return (
      this.SUPABASE_URL &&
      !this.SUPABASE_URL.includes("YOUR_PROJECT_ID") &&
      this.SUPABASE_ANON_KEY &&
      !this.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
    );
  }
};
