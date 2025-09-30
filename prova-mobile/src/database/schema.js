// Schema simplificado para Expo SQLite
export const createTables = `
  CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    recipient_name TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'PENDING'
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    type TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    reason TEXT,
    notes TEXT,
    created_at INTEGER NOT NULL,
    sync_status TEXT DEFAULT 'PENDING',
    FOREIGN KEY (delivery_id) REFERENCES deliveries (id)
  );

  CREATE TABLE IF NOT EXISTS media (
    id TEXT PRIMARY KEY,
    delivery_id TEXT NOT NULL,
    type TEXT NOT NULL,
    local_path TEXT NOT NULL,
    sync_status TEXT DEFAULT 'PENDING',
    retry_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (delivery_id) REFERENCES deliveries (id)
  );
`;

