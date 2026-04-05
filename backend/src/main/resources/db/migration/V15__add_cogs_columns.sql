-- V15: Add COGS/HPP snapshot columns
-- Snapshot HPP di tabel productions (disimpan saat produksi dicatat, tidak berubah)
ALTER TABLE productions ADD COLUMN IF NOT EXISTS actual_cost_per_unit NUMERIC(19,2) DEFAULT 0 NOT NULL;
ALTER TABLE productions ADD COLUMN IF NOT EXISTS total_actual_cost    NUMERIC(19,2) DEFAULT 0 NOT NULL;

-- HPP per order item (snapshot saat order status → DONE)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS cogs_per_unit NUMERIC(19,2) DEFAULT 0 NOT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS total_cogs    NUMERIC(19,2) DEFAULT 0 NOT NULL;
