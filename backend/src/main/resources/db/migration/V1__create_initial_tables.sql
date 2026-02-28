-- enable uuid generator
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE units (
   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
   name varchar(50) NOT NULL,
   symbol varchar(50) NOT NULL,
   created_at timestamp DEFAULT CURRENT_TIMESTAMP,
   created_by varchar(50) DEFAULT 'SYSTEM',
   updated_at timestamp,
   updated_by varchar(50),
   is_deleted boolean DEFAULT false
);

CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name varchar(50) NOT NULL,
    type varchar(50) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(50) DEFAULT 'SYSTEM',
    updated_at timestamp,
    updated_by varchar(50),
    is_deleted boolean DEFAULT false
);

CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_name ON categories(name);

CREATE TABLE ingredients (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     category_id uuid NOT NULL,
     unit_id uuid NOT NULL,
     name varchar(255) NOT NULL,
     stock_quantity decimal(12,3) DEFAULT 0,
     minimum_stock decimal(12,3) DEFAULT 0,
     avg_purchase_price decimal(15,3) DEFAULT 0,
     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
     created_by varchar(50) DEFAULT 'SYSTEM',
     updated_at timestamp,
     updated_by varchar(50),
     is_deleted boolean DEFAULT false
);

ALTER TABLE ingredients
    ADD CONSTRAINT fk_ingredients_category
        FOREIGN KEY (category_id)
            REFERENCES categories(id);

ALTER TABLE ingredients
    ADD CONSTRAINT fk_ingredients_unit
        FOREIGN KEY (unit_id)
            REFERENCES units(id);

CREATE INDEX idx_ingredients_category_id
    ON ingredients(category_id);

CREATE INDEX idx_ingredients_unit_id
    ON ingredients(unit_id);

CREATE INDEX idx_ingredients_name
    ON ingredients(name);

CREATE INDEX idx_ingredients_not_deleted
    ON ingredients(is_deleted);

CREATE TABLE ingredients_stock_histories (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     ingredient_id uuid NOT NULL,
     type varchar(50) NOT NULL,
     quantity decimal(12,3) NOT NULL,
     purchase_price decimal(15,3),
     notes text null,
     reference_id uuid,
     reference_type varchar(50),
     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
     created_by varchar(50) DEFAULT 'SYSTEM',
     updated_at timestamp,
     updated_by varchar(50),
     is_deleted boolean DEFAULT false
);

ALTER TABLE ingredients_stock_histories
    ADD CONSTRAINT fk_stock_history_ingredient
        FOREIGN KEY (ingredient_id)
            REFERENCES ingredients(id);

CREATE INDEX idx_stock_history_ingredient_id
    ON ingredients_stock_histories(ingredient_id);

CREATE INDEX idx_stock_history_type
    ON ingredients_stock_histories(type);

CREATE INDEX idx_stock_history_reference_id
    ON ingredients_stock_histories(reference_id);

CREATE INDEX idx_stock_history_not_deleted
    ON ingredients_stock_histories(is_deleted);

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL,
  unit_id uuid NOT NULL,
  name varchar(150) NOT NULL,
  type varchar(20) NOT NULL, -- made_to_order | made_to_stock | resell
  default_price decimal(15,2) NOT NULL,
  stock_quantity decimal(12,3) DEFAULT 0,
  estimated_cost decimal(15,2) DEFAULT 0,
  target_margin decimal(5,2) DEFAULT 30,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(50) DEFAULT 'SYSTEM',
  updated_at timestamp,
  updated_by varchar(50),
  is_deleted boolean DEFAULT false
);

ALTER TABLE products
    ADD CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id);

ALTER TABLE products
    ADD CONSTRAINT fk_products_unit
        FOREIGN KEY (unit_id) REFERENCES units(id);

CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_unit ON products(unit_id);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_not_deleted ON products(is_deleted);

CREATE TABLE product_recipes (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     product_id uuid NOT NULL,
     version_number int NOT NULL,
     is_active boolean DEFAULT false,
     notes text,
     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
     created_by varchar(50) DEFAULT 'SYSTEM',
     updated_at timestamp,
     updated_by varchar(50),
     is_deleted boolean DEFAULT false
);

ALTER TABLE product_recipes
    ADD CONSTRAINT fk_recipe_product
        FOREIGN KEY (product_id) REFERENCES products(id);

CREATE INDEX idx_recipe_product ON product_recipes(product_id);
CREATE INDEX idx_recipe_active ON product_recipes(is_active);

CREATE TABLE product_recipe_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id uuid NOT NULL,
  ingredient_id uuid NOT NULL,
  quantity decimal(12,3) NOT NULL,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  created_by varchar(50) DEFAULT 'SYSTEM',
  updated_at timestamp,
  updated_by varchar(50),
  is_deleted boolean DEFAULT false
);

ALTER TABLE product_recipe_items
    ADD CONSTRAINT fk_recipe_item_recipe
        FOREIGN KEY (recipe_id) REFERENCES product_recipes(id);

ALTER TABLE product_recipe_items
    ADD CONSTRAINT fk_recipe_item_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES ingredients(id);

CREATE INDEX idx_recipe_item_recipe ON product_recipe_items(recipe_id);
CREATE INDEX idx_recipe_item_ingredient ON product_recipe_items(ingredient_id);

CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number varchar(20) UNIQUE,
    customer_name varchar(150) NOT NULL,
    customer_phone varchar(20),
    customer_address text,
    order_date date NOT NULL,
    required_date date,
    status varchar(20) NOT NULL, -- pending | process | done | delivered | cancelled
    total_amount decimal(15,2) NOT NULL,
    paid_amount decimal(15,2) DEFAULT 0,
    payment_status varchar(20) NOT NULL, -- unpaid | dp | paid
    notes text,
    system_notes text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(50) DEFAULT 'SYSTEM',
    updated_at timestamp,
    updated_by varchar(50),
    is_deleted boolean DEFAULT false
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_not_deleted ON orders(is_deleted);

CREATE TABLE order_items (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     order_id uuid NOT NULL,
     product_id uuid NOT NULL,
     quantity decimal(12,3) NOT NULL,
     unit_price decimal(15,2) NOT NULL,
     subtotal decimal(15,2) NOT NULL,
     notes text,
     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
     created_by varchar(50) DEFAULT 'SYSTEM',
     updated_at timestamp,
     updated_by varchar(50),
     is_deleted boolean DEFAULT false
);

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_item_order
        FOREIGN KEY (order_id) REFERENCES orders(id);

ALTER TABLE order_items
    ADD CONSTRAINT fk_order_item_product
        FOREIGN KEY (product_id) REFERENCES products(id);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE order_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id uuid NOT NULL,
    amount decimal(15,2) NOT NULL,
    payment_type varchar(20) NOT NULL, -- dp | settlement
    payment_date date NOT NULL,
    notes text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(50) DEFAULT 'SYSTEM',
    updated_at timestamp,
    updated_by varchar(50),
    is_deleted boolean DEFAULT false
);

ALTER TABLE order_payments
    ADD CONSTRAINT fk_payment_order
        FOREIGN KEY (order_id) REFERENCES orders(id);

CREATE INDEX idx_payment_order ON order_payments(order_id);

CREATE TABLE productions (
     id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
     product_id uuid NOT NULL,
     recipe_id uuid NOT NULL,
     quantity_produced decimal(12,3) NOT NULL,
     production_date date NOT NULL,
     status varchar(20) NOT NULL, -- success | failed
     notes text,
     created_at timestamp DEFAULT CURRENT_TIMESTAMP,
     created_by varchar(50) DEFAULT 'SYSTEM',
     updated_at timestamp,
     updated_by varchar(50),
     is_deleted boolean DEFAULT false
);

ALTER TABLE productions
    ADD CONSTRAINT fk_production_product
        FOREIGN KEY (product_id) REFERENCES products(id);

ALTER TABLE productions
    ADD CONSTRAINT fk_production_recipe
        FOREIGN KEY (recipe_id) REFERENCES product_recipes(id);

CREATE INDEX idx_production_product ON productions(product_id);

CREATE TABLE cash_flows (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    type varchar(10) NOT NULL, -- in | out
    category varchar(50) NOT NULL,
    amount decimal(15,2) NOT NULL,
    description varchar(255) NOT NULL,
    reference_type varchar(50),
    reference_id uuid,
    transaction_date date NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by varchar(50) DEFAULT 'SYSTEM',
    updated_at timestamp,
    updated_by varchar(50),
    is_deleted boolean DEFAULT false
);

CREATE INDEX idx_cashflow_date ON cash_flows(transaction_date);
CREATE INDEX idx_cashflow_reference ON cash_flows(reference_id);

CREATE TABLE users (
   id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
   name varchar(150) NOT NULL,
   email varchar(255) UNIQUE NOT NULL,
   password varchar(255) NOT NULL,
   role varchar(20) DEFAULT 'admin', -- admin | owner
   is_active boolean DEFAULT true,
   created_at timestamp DEFAULT CURRENT_TIMESTAMP,
   created_by varchar(50) DEFAULT 'SYSTEM',
   updated_at timestamp,
   updated_by varchar(50),
   is_deleted boolean DEFAULT false
);

CREATE INDEX idx_users_email ON users(email);