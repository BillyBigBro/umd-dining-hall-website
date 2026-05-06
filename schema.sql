CREATE TABLE IF NOT EXISTS search_counts (
  food_name TEXT PRIMARY KEY,
  url TEXT,
  search_count INTEGER NOT NULL DEFAULT 0,
  last_searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
