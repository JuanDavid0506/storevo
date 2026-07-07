-- ============================================================
-- STOREVO — Baseline Schema por Tenant
-- Sincronizado con los Entity Java (Order, Product, Category, OrderItem, ProductImage)
-- ============================================================

-- Tabla de Categorías
CREATE TABLE categories (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    parent_id     BIGINT        NULL,
    name          VARCHAR(100)  NOT NULL,
    description   TEXT,
    image_url     VARCHAR(500),
    is_active     BOOLEAN       NOT NULL DEFAULT TRUE,
    show_in_nav   BOOLEAN       NOT NULL DEFAULT TRUE,
    display_order INT           NOT NULL DEFAULT 0,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabla de Productos
CREATE TABLE products (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id    BIGINT,
    name           VARCHAR(150)    NOT NULL,
    description    TEXT,
    price          DOUBLE          NOT NULL,
    discount_price DOUBLE          DEFAULT 0.00,
    stock          INT             NOT NULL DEFAULT 0,
    brand          VARCHAR(100),
    sku            VARCHAR(50),
    weight         DOUBLE,
    attributes_json JSON,
    variants_json  JSON,
    is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Tabla de Imágenes de Productos (PREPARADA PARA ESCALAR E IA)
CREATE TABLE product_images (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id         BIGINT          NOT NULL,
    variant_id         BIGINT          NULL,

    file_name          VARCHAR(255)    NOT NULL,
    original_file_name VARCHAR(255)    NOT NULL, -- Auditoría
    file_path          VARCHAR(500)    NOT NULL,

    file_hash          VARCHAR(64)     NULL,
    alt_text           VARCHAR(255)    NULL,
    width              INT             NULL,
    height             INT             NULL,
    mime_type          VARCHAR(50)     NULL,
    file_size          BIGINT          NULL,
    ai_tags            JSON            NULL, -- Preparación IA

    is_primary         BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_position      INT             NOT NULL DEFAULT 0,
    created_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_file_hash (file_hash) -- Mejora de rendimiento para caché/CDNs/Duplicados
);

-- Tabla de Pedidos
CREATE TABLE orders (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    customer_name         VARCHAR(150)   NOT NULL,
    customer_phone        VARCHAR(50)    NOT NULL,
    address               VARCHAR(255)   NOT NULL,
    city                  VARCHAR(100)   NOT NULL,
    notes                 TEXT,
    total                 DOUBLE         NOT NULL DEFAULT 0,
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