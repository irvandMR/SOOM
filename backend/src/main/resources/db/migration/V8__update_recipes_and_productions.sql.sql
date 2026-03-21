ALTER TABLE product_recipes
    ADD COLUMN estimated_yield DECIMAL(10,3) NULL,
ADD COLUMN yield_unit_id UUID NULL;

ALTER TABLE productions
    ADD COLUMN unit_id UUID NULL,
ADD COLUMN actual_yield DECIMAL(10,3) NULL;

-- Tambah FK setelah kolom dibuat
ALTER TABLE product_recipes
    ADD CONSTRAINT product_recipes_yield_unit_id_fkey
        FOREIGN KEY (yield_unit_id) REFERENCES units(id)
            ON DELETE SET NULL;

ALTER TABLE productions
    ADD CONSTRAINT productions_unit_id_fkey
        FOREIGN KEY (unit_id) REFERENCES units(id)
            ON DELETE SET NULL;