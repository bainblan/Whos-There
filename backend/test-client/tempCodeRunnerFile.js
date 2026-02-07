/**
 * Pseudo-frontend smoke test for Supabase + RLS
 *
 * What this file does:
 * 1) Loads env vars from ./env
 * 2) Connects to Supabase
 * 3) Signs in as a real auth user
 * 4) Runs SELECT / INSERT / UPDATE on Username table
 * 5) Proves RLS + ownership works
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const { createClient } = require("@supabase/supabase-js");

/* ---------------------------------------------
   ENV CHECK (FAIL FAST)
--------------------------------------------- */
console.log("ENV CHECK");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "OK" : "MISSING");
console.log("SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "OK" : "MISSING");
console.log("USER_EMAIL:", process.env.USER_EMAIL ? "OK" : "MISSING");
console.log("USER_PASSWORD:", process.env.USER_PASSWORD ? "OK" : "MISSING");

if (
  !process.env.SUPABASE_URL ||
  !process.env.SUPABASE_ANON_KEY ||
  !process.env.USER_EMAIL ||
  !process.env.USER_PASSWORD
) {
  console.error("\n❌ Missing required environment variables. Check .env file.\n");
  process.exit(1);
}

/* ---------------------------------------------
   CREATE SUPABASE CLIENT
--------------------------------------------- */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ---------------------------------------------
   MAIN TEST FLOW
--------------------------------------------- */
async function main() {
  console.log("\n🔐 Signing in...");

  const { data: signInData, error: signInErr } =
    await supabase.auth.signInWithPassword({
      email: process.env.USER_EMAIL,
      password: process.env.USER_PASSWORD,
    });

  if (signInErr) {
    console.error("❌ SIGN IN ERROR:", signInErr.message);
    process.exit(1);
  }

  console.log("✅ SIGNED IN USER ID:", signInData.user.id);

  /* ----------------------------------------- */
  console.log("\n📖 READ (should only show this user's row)");

  const read1 = await supabase.from("Username").select("*");
  console.log("DATA:", read1.data);
  console.log("ERROR:", read1.error?.message ?? null);

  /* ----------------------------------------- */
  console.log("\n➕ INSERT (only works if no row exists)");

  const insertRes = await supabase
    .from("Username")
    .insert({ username: "pseudo_test" });

  console.log("INSERT ERROR:", insertRes.error?.message ?? "ok");

  /* ----------------------------------------- */
  console.log("\n✏️ UPDATE (updates only their row)");

  const updateRes = await supabase
    .from("Username")
    .update({ username: "pseudo_test_updated" });

  console.log("UPDATE ERROR:", updateRes.error?.message ?? "ok");

  /* ----------------------------------------- */
  console.log("\n📖 READ AGAIN");

  const read2 = await supabase.from("Username").select("*");
  console.log("DATA:", read2.data);
  console.log("ERROR:", read2.error?.message ?? null);

  console.log("\n✅ TEST COMPLETE");
}

main().catch((err) => {
  console.error("UNHANDLED ERROR:", err);
});
