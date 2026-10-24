CREATE TABLE IF NOT EXISTS orders (
  order_id BIGINT PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  order_date TIMESTAMP NOT NULL,
  total_amount DECIMAL(14,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS order_items (
  order_id BIGINT NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(14,2) NOT NULL
);
