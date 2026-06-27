-- ============================================================
-- STOREVO — Baseline Schema por Tenant
-- Sincronizado con los Entity Java (Order, Product, Category, OrderItem)
-- ============================================================

-- Tabla de Categorías
CREATE TABLE categories (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100)  NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    display_order INT           NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE products (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id    BIGINT,
    name           VARCHAR(150)    NOT NULL,
    description    TEXT,
    price          DECIMAL(12, 2)  NOT NULL,
    discount_price DECIMAL(12, 2)  DEFAULT 0.00,
    stock          INT             NOT NULL DEFAULT 0,
    brand          VARCHAR(100),
    sku            VARCHAR(50),
    weight         DOUBLE,
    images_json    JSON,
    attributes_json JSON,
    variants_json  JSON,
    is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabla de Pedidos
CREATE TABLE orders (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name         VARCHAR(150)   NOT NULL,
    customer_phone        VARCHAR(50)    NOT NULL,
    address               VARCHAR(255)   NOT NULL,
    city                  VARCHAR(100)   NOT NULL,
    notes                 TEXT,
    total                 DOUBLE         NOT NULL,
    status                VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    wompi_transaction_id  VARCHAR(100),
    created_at            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Items del Pedido
CREATE TABLE order_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT         NOT NULL,
    product_id   BIGINT         NOT NULL,
    product_name VARCHAR(150)   NOT NULL,
    price        DOUBLE         NOT NULL,
    quantity     INT            NOT NULL,
    subtotal     DOUBLE         NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);