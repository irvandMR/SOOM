INSERT INTO tenants (id, business_name, email, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'SOOM Default', 'admin@soom.com', true);

UPDATE users
SET tenant_id = '00000000-0000-0000-0000-000000000001',
    tenant_role = 'OWNER'
WHERE tenant_id IS NULL;

UPDATE categories           SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE products             SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE ingredients          SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE productions          SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE orders               SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE cash_flows           SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE product_recipes      SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;
UPDATE product_recipe_items SET tenant_id = '00000000-0000-0000-0000-000000000001' WHERE tenant_id IS NULL;