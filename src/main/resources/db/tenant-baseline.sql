-- ============================================================
-- STOREVO — Baseline Schema por Tenant (Sincronizado con C1-C7)
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
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
    CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_categories_parent_order (parent_id, display_order),
    INDEX idx_categories_nav (is_active, show_in_nav, parent_id, display_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS brands (
                                      id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                                      name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(120) NOT NULL,
    logo_url   VARCHAR(500),
    is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_brands_slug (slug),
    INDEX idx_brands_active_name (is_active, name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
                                        id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        category_id      BIGINT          NULL,
                                        name             VARCHAR(150)    NOT NULL,
    description      TEXT,
    price            DOUBLE          NOT NULL DEFAULT 0.0,
    discount_price   DOUBLE          DEFAULT 0.00,
    stock            INT             NOT NULL DEFAULT 0,
    brand            VARCHAR(100),
    brand_id         BIGINT          NULL,
    sku              VARCHAR(50),
    weight           DOUBLE,
    has_variants     BOOLEAN         NOT NULL DEFAULT FALSE,
    is_made_to_order BOOLEAN         NOT NULL DEFAULT FALSE,
    is_featured      BOOLEAN         NOT NULL DEFAULT FALSE,
    attributes_json  JSON,
    is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
    is_deleted       BOOLEAN         NOT NULL DEFAULT FALSE,
    is_draft         BOOLEAN         NOT NULL DEFAULT FALSE,
    version          BIGINT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
    INDEX idx_products_visible (is_deleted, is_active, is_draft, id),
    INDEX idx_products_featured (is_deleted, is_active, is_draft, is_featured, id),
    INDEX idx_products_brand_id (brand_id, is_deleted, is_active, is_draft, id),
    INDEX idx_products_category_id (category_id, is_deleted, is_active, is_draft, id),
    INDEX idx_products_sku (sku)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_options (
                                               id             BIGINT AUTO_INCREMENT PRIMARY KEY,
                                               product_id     BIGINT          NOT NULL,
                                               name           VARCHAR(100)    NOT NULL,
    sort_position  INT             NOT NULL DEFAULT 0,
    CONSTRAINT fk_product_options_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_product_options_product (product_id, sort_position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_option_values (
                                                     id             BIGINT AUTO_INCREMENT PRIMARY KEY,
                                                     option_id      BIGINT          NOT NULL,
                                                     value_name     VARCHAR(100)    NOT NULL,
    sort_position  INT             NOT NULL DEFAULT 0,
    CONSTRAINT fk_option_values_option FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE,
    INDEX idx_option_values_option (option_id, sort_position)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variants (
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
    version          BIGINT          NOT NULL DEFAULT 0,
    created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_variants_product_active (product_id, is_active),
    INDEX idx_variants_sku (sku)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_variant_values (
                                                      variant_id       BIGINT NOT NULL,
                                                      option_value_id  BIGINT NOT NULL,
                                                      PRIMARY KEY (variant_id, option_value_id),
    CONSTRAINT fk_pvv_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    CONSTRAINT fk_pvv_option_value FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
                                              id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              product_id    BIGINT       NOT NULL,
                                              variant_id    BIGINT       NULL,
                                              secure_url    VARCHAR(500) NOT NULL,
    public_id     VARCHAR(255) NOT NULL,
    alt_text      VARCHAR(255),
    ai_tags       JSON,
    is_primary    BOOLEAN      NOT NULL DEFAULT FALSE,
    sort_position INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_images_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_product_images_product_sort (product_id, sort_position),
    INDEX idx_product_images_variant (variant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- OMS: MÓDULO DE PEDIDOS, HISTORIAL, NOTAS Y RESEÑAS
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
                                      id                          BIGINT AUTO_INCREMENT PRIMARY KEY,
                                      public_token                VARCHAR(64)    NOT NULL,
    customer_name               VARCHAR(100)   NOT NULL,
    customer_phone              VARCHAR(20)    NOT NULL,
    customer_email              VARCHAR(120)   NULL,
    document_type               VARCHAR(10)    NULL,
    customer_document           VARCHAR(30)    NULL,
    verification_digit          VARCHAR(5)     NULL,
    legal_name                  VARCHAR(150)   NULL,
    tax_regime                  VARCHAR(40)    NULL,
    requires_electronic_invoice BOOLEAN        DEFAULT FALSE,
    address                     VARCHAR(200)   NOT NULL,
    city                        VARCHAR(100)   NOT NULL,
    notes                       TEXT,
    total                       DOUBLE         NOT NULL DEFAULT 0.0,
    status                      VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
    channel                     VARCHAR(20)    NOT NULL DEFAULT 'ONLINE',
    payment_method              VARCHAR(50)    DEFAULT 'Wompi / Tarjeta',
    stock_deducted              BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                  TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_orders_public_token (public_token),
    INDEX idx_orders_status_created (status, created_at),
    INDEX idx_orders_channel_created (channel, created_at),
    INDEX idx_orders_customer_phone (customer_phone, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_history (
                                             id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             order_id        BIGINT         NOT NULL,
                                             event_type      VARCHAR(30)    NOT NULL,
    origin          VARCHAR(30)    NOT NULL,
    old_status      VARCHAR(30),
    new_status      VARCHAR(30),
    description     TEXT,
    user_id         BIGINT,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_history_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_history_order (order_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_notes (
                                           id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                                           order_id        BIGINT         NOT NULL,
                                           note            TEXT           NOT NULL,
                                           user_id         BIGINT,
                                           created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                           CONSTRAINT fk_order_notes_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_order_notes_order (order_id, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
                                           id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                                           order_id     BIGINT         NOT NULL,
                                           product_id   BIGINT         NOT NULL,
                                           variant_id   BIGINT         NULL,
                                           product_name VARCHAR(150)   NOT NULL,
    price        DOUBLE         NOT NULL,
    quantity     INT            NOT NULL,
    subtotal     DOUBLE         NOT NULL,
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_order_items_order (order_id),
    INDEX idx_order_items_product (product_id, order_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS store_reviews (
                                             id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                                             order_id      BIGINT       NOT NULL,
                                             customer_name VARCHAR(100) NOT NULL,
    customer_city VARCHAR(100),
    rating        INT          NOT NULL DEFAULT 5,
    comment       VARCHAR(500) NOT NULL,
    is_visible    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_store_reviews_order (order_id),
    CONSTRAINT fk_store_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    INDEX idx_store_reviews_visible (is_visible, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CARRITO Y LISTA DE DESEOS
-- ============================================================

CREATE TABLE IF NOT EXISTS cart_items (
                                          id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                                          product_id   BIGINT         NOT NULL,
                                          variant_id   BIGINT         NULL,
                                          quantity     INT            NOT NULL,
                                          session_id   VARCHAR(255)   NOT NULL,
    created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL,
    INDEX idx_cart_items_session (session_id, product_id, variant_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS wishlist_items (
                                              id         BIGINT AUTO_INCREMENT PRIMARY KEY,
                                              product_id BIGINT       NOT NULL,
                                              session_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlist_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist_item (session_id, product_id),
    INDEX idx_wishlist_session (session_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- LOGÍSTICA Y ENVÍOS
-- ============================================================

CREATE TABLE IF NOT EXISTS carriers (
                                        id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
                                        name                  VARCHAR(100) NOT NULL,
    code                  VARCHAR(50)  NOT NULL,
    tracking_url_template VARCHAR(500),
    is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_carriers_code (code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO carriers (name, code, tracking_url_template) VALUES
    ('Coordinadora', 'COORDINADORA', 'https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/?guia={trackingNumber}'),
    ('Servientrega', 'SERVIENTREGA', 'https://www.servientrega.com/wps/portal/Colombia/transacciones-personas/rastreo-envios/detalle?tracking={trackingNumber}'),
    ('Inter Rapidísimo', 'INTER_RAPIDISIMO', 'https://www.interrapidisimo.com/sigue-tu-envio/?numeroDeGuia={trackingNumber}'),
    ('Entrega Propia / Otro', 'CUSTOM', null);

CREATE TABLE IF NOT EXISTS shipments (
                                         id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
                                         order_id              BIGINT       NOT NULL,
                                         carrier_id            BIGINT       NOT NULL,
                                         tracking_number       VARCHAR(100),
    label_pdf_url         VARCHAR(500),
    last_tracking_message VARCHAR(255),
    external_shipment_id  VARCHAR(100),
    status                VARCHAR(50)  NOT NULL DEFAULT 'CREATED',
    package_number        INT          NOT NULL DEFAULT 1,
    weight                DOUBLE,
    dimensions            VARCHAR(50),
    created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_shipments_carrier FOREIGN KEY (carrier_id) REFERENCES carriers(id),
    INDEX idx_shipments_order (order_id, package_number),
    INDEX idx_shipments_external_id (external_shipment_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;