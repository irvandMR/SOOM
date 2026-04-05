CREATE TABLE tenants (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     business_name VARCHAR(100) NOT NULL,
     address TEXT,
     phone VARCHAR(20),
     email VARCHAR(100),
     bank_name VARCHAR(50),
     bank_account VARCHAR(50),
     bank_account_name VARCHAR(100),
     invoice_footer TEXT,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT now(),
     created_by VARCHAR(50) DEFAULT 'SYSTEM',
     updated_at TIMESTAMP DEFAULT now(),
     updated_by VARCHAR(50),
     is_deleted BOOLEAN DEFAULT false
);

ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN tenant_role VARCHAR(20) DEFAULT 'OWNER';
ALTER TABLE users ADD COLUMN must_change_password BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN temp_password_expires_at TIMESTAMP;

ALTER TABLE categories          ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE products            ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE ingredients         ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE productions         ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE orders              ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE cash_flows          ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE product_recipes     ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE product_recipe_items ADD COLUMN tenant_id UUID REFERENCES tenants(id);