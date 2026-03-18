ALTER TABLE ingredients
    ADD COLUMN purchase_price DECIMAL(15,3) DEFAULT 0;

ALTER TABLE products DROP COLUMN default_price;

ALTER TABLE productions
    ADD COLUMN price DECIMAL(15,3) DEFAULT 0;