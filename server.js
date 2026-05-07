const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Database connection failed" });
  }
});

app.post("/api/searches", async (req, res) => {
  const { food_name: foodName, url } = req.body || {};
  if (!foodName) {
    return res.status(400).json({ error: "food_name is required" });
  }

  try {
    await pool.query(
      `INSERT INTO search_events (food_name, url, searched_at)
       VALUES ($1, $2, NOW())`,
      [foodName, url || null]
    );

    const result = await pool.query(
      `INSERT INTO search_counts (food_name, url, search_count, last_searched_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (food_name)
       DO UPDATE SET
         search_count = search_counts.search_count + 1,
         last_searched_at = NOW(),
         url = COALESCE(EXCLUDED.url, search_counts.url)
       RETURNING food_name, search_count`,
      [foodName, url || null]
    );

    res.json({
      food_name: result.rows[0].food_name,
      search_count: result.rows[0].search_count,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to record search" });
  }
});

app.get("/api/top-searches", async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
  try {
    const result = await pool.query(
      `SELECT food_name, url, search_count, last_searched_at
       FROM search_counts
       ORDER BY search_count DESC, last_searched_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ items: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch top searches" });
  }
});

app.get("/api/top-searches-weekly", async (req, res) => {
  const limit = Math.min(Number.parseInt(req.query.limit, 10) || 20, 100);
  try {
    const result = await pool.query(
      `SELECT food_name, url, COUNT(*)::int AS search_count, MAX(searched_at) AS last_searched_at
       FROM search_events
       WHERE searched_at >= NOW() - INTERVAL '7 days'
       GROUP BY food_name, url
       ORDER BY search_count DESC, last_searched_at DESC
       LIMIT $1`,
      [limit]
    );
    res.json({ items: result.rows });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weekly searches" });
  }
});

app.listen(port, () => {
  console.log(`Search tracker listening on ${port}`);
});
