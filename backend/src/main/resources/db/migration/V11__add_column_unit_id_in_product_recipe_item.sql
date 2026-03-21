ALTER TABLE product_recipe_items
    ADD COLUMN unit_id UUID NULL REFERENCES units(id);