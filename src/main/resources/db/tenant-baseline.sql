-- ============================================================
-- STOREVO — Baseline Schema por Tenant
-- Sincronizado con Fase 2: Arquitectura Híbrida de Variantes
-- ============================================================

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

-- Se añade has_variants para compatibilidad
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
    has_variants   BOOLEAN         NOT NULL DEFAULT FALSE, -- MODO HÍBRIDO
    attributes_json JSON,
    is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted     BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- NUEVO: Opciones Relacionales
CREATE TABLE product_options (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id     BIGINT          NOT NULL,
    name           VARCHAR(100)    NOT NULL,
    sort_position  INT             NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- NUEVO: Valores de Opciones
CREATE TABLE product_option_values (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    option_id      BIGINT          NOT NULL,
    value_name     VARCHAR(100)    NOT NULL,
    sort_position  INT             NOT NULL DEFAULT 0,
    FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE
);

-- NUEVO: Variantes (Super Entidad Preparada)
CREATE TABLE product_variants (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id       BIGINT          NOT NULL,
    sku              VARCHAR(100),
    barcode          VARCHAR(100),
    price            DOUBLE          NULL,
    compare_at_price DOUBLE          NULL,
    cost_price       DOUBLE          NULL,
    stock            INT             NOT NULL DEFAULT 0,
    low_stock_alert  INT             NULL,
    weight           DOUBLE          NULL,
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- NUEVO: Tabla Intermedia (Combinaciones estrictamente relacionales)
CREATE TABLE product_variant_values (
    variant_id       BIGINT NOT NULL,
    option_value_id  BIGINT NOT NULL,
    PRIMARY KEY (variant_id, option_value_id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
);

-- Imágenes preparadas con variant_id
CREATE TABLE product_images (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id         BIGINT          NOT NULL,
    variant_id         BIGINT          NULL,
    file_name          VARCHAR(255)    NOT NULL,
    original_file_name VARCHAR(255)    NOT NULL,
    file_path          VARCHAR(500)    NOT NULL,
    file_hash          VARCHAR(64)     NULL,
    alt_text           VARCHAR(255)    NULL,
    width              INT             NULL,
    height             INT             NULL,
    mime_type          VARCHAR(50)     NULL,
    file_size          BIGINT          NULL,
    ai_tags            JSON            NULL,
    is_primary         BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_position      INT             NOT NULL DEFAULT 0,
    created_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_file_hash (file_hash)
);

-- Pedidos
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

-- Preparado para Variantes
CREATE TABLE order_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT         NOT NULL,
    product_id   BIGINT         NOT NULL,
    variant_id   BIGINT         NULL,  -- PREPARADO
    product_name VARCHAR(150)   NOT NULL,
    price        DOUBLE         NOT NULL,
    quantity     INT            NOT NULL,
    subtotal     DOUBLE         NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- Carrito Preparado
CREATE TABLE cart_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id   BIGINT         NOT NULL,
    variant_id   BIGINT         NULL,  -- PREPARADO
    quantity     INT            NOT NULL,
    session_id   VARCHAR(255)   NOT NULL,
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);