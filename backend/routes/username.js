const express = require("express");
const { getSupabaseForUser } = require("../lib/supabase");

const router = express.Router();

/**
 * Extracts Bearer token from Authorization header.
 */
function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim();
}

/**
 * POST /api/username
 * Body: { "username": "connor123" }
 *
 * Requires Authorization: Bearer <user_access_token>
 * Runs under the user’s identity so RLS applies.
 */
router.post("/username", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, error: "Missing Bearer token" });

    const { username } = req.body || {};
    if (!username || typeof username !== "string") {
      return res.status(400).json({ ok: false, error: "Missing or invalid username" });
    }

    const supabase = getSupabaseForUser(token);

    // Option 1: insert if missing (will fail if row exists, depending on constraints)
    // const { data, error } = await supabase.from("Username").insert({ username }).select("*");

    // Option 2: update only (works if row already exists)
    // const { data, error } = await supabase.from("Username").update({ username }).select("*");

    // Option 3 (recommended): upsert (insert or update)
    // Requires your table to have a UNIQUE constraint on user_id (or another key)
    const { data, error } = await supabase
      .from("Username")
      .upsert({ username }, { onConflict: "user_id" })
      .select("*");

    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

/**
 * GET /api/username
 * Requires Authorization: Bearer <user_access_token>
 * Returns only the calling user’s row if RLS is set correctly.
 */
router.get("/username", async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ ok: false, error: "Missing Bearer token" });

    const supabase = getSupabaseForUser(token);

    const { data, error } = await supabase.from("Username").select("*");

    if (error) return res.status(400).json({ ok: false, error: error.message });

    return res.json({ ok: true, data });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
