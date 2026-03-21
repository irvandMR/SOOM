ALTER TABLE productions
    ADD COLUMN available_qty DECIMAL(10,3) NULL;

ALTER TABLE order_items
    ADD COLUMN production_id UUID NULL REFERENCES productions(id);