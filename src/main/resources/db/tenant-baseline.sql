-- ============================================================
-- STOREVO — Baseline Schema por Tenant
-- Sincronizado con Fase 3.2: Logística y Envíos
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

-- Se añade has_variants e is_made_to_order para compatibilidad
CREATE TABLE products (
                          id               BIGINT AUTO_INCREMENT PRIMARY KEY,
                          category_id      BIGINT,
                          name             VARCHAR(150)    NOT NULL,
                          description      TEXT,
                          price            DOUBLE          NOT NULL,
                          discount_price   DOUBLE          DEFAULT 0.00,
                          stock            INT             NOT NULL DEFAULT 0,
                          brand            VARCHAR(100),
                          sku              VARCHAR(50),
                          weight           DOUBLE,
                          has_variants     BOOLEAN         NOT NULL DEFAULT FALSE, -- MODO HÍBRIDO
                          is_made_to_order BOOLEAN         NOT NULL DEFAULT FALSE, -- BAJO PEDIDO
                          attributes_json  JSON,
                          is_active        BOOLEAN         NOT NULL DEFAULT TRUE,
                          is_deleted       BOOLEAN         NOT NULL DEFAULT FALSE,
                          is_draft         BOOLEAN         NOT NULL DEFAULT FALSE,
                          created_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                          updated_at       TIMESTAMP       DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                          FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Opciones Relacionales
CREATE TABLE product_options (
                                 id             BIGINT AUTO_INCREMENT PRIMARY KEY,
                                 product_id     BIGINT          NOT NULL,
                                 name           VARCHAR(100)    NOT NULL,
                                 sort_position  INT             NOT NULL DEFAULT 0,
                                 FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Valores de Opciones
CREATE TABLE product_option_values (
                                       id             BIGINT AUTO_INCREMENT PRIMARY KEY,
                                       option_id      BIGINT          NOT NULL,
                                       value_name     VARCHAR(100)    NOT NULL,
                                       sort_position  INT             NOT NULL DEFAULT 0,
                                       FOREIGN KEY (option_id) REFERENCES product_options(id) ON DELETE CASCADE
);

-- Variantes (Super Entidad Preparada)
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

-- Tabla Intermedia (Combinaciones estrictamente relacionales)
CREATE TABLE product_variant_values (
                                        variant_id       BIGINT NOT NULL,
                                        option_value_id  BIGINT NOT NULL,
                                        PRIMARY KEY (variant_id, option_value_id),
                                        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
                                        FOREIGN KEY (option_value_id) REFERENCES product_option_values(id) ON DELETE CASCADE
);

-- Imágenes preparadas con variant_id
CREATE TABLE product_images (
                                id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                                product_id    BIGINT NOT NULL,
                                variant_id    BIGINT,
                                secure_url    VARCHAR(500) NOT NULL,
                                public_id     VARCHAR(255) NOT NULL,
                                alt_text      VARCHAR(255),
                                ai_tags       JSON,
                                is_primary    BOOLEAN NOT NULL DEFAULT FALSE,
                                sort_position INT NOT NULL DEFAULT 0,
                                created_at    TIMESTAMP,
                                updated_at    TIMESTAMP
);

-- ============================================================
-- OMS: MÓDULO DE PEDIDOS Y GESTIÓN (FASE 3.1)
-- ============================================================

CREATE TABLE orders (
                        id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
                        customer_name         VARCHAR(150)   NOT NULL,
                        customer_phone        VARCHAR(50)    NOT NULL,
                        customer_document     VARCHAR(255)   NULL,
                        address               VARCHAR(255)   NOT NULL,
                        city                  VARCHAR(100)   NOT NULL,
                        notes                 TEXT,
                        total                 DOUBLE         NOT NULL DEFAULT 0,
                        status                VARCHAR(30)    NOT NULL DEFAULT 'PENDING',
                        payment_method        VARCHAR(50)    DEFAULT 'Wompi / Tarjeta',
                        channel               VARCHAR(30)    NOT NULL DEFAULT 'ONLINE',
                        created_at            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                        updated_at            TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_history (
                               id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                               order_id        BIGINT         NOT NULL,
                               event_type      VARCHAR(30)    NOT NULL,
                               origin          VARCHAR(30)    NOT NULL,
                               old_status      VARCHAR(30),
                               new_status      VARCHAR(30),
                               description     TEXT,
                               user_id         BIGINT,
                               created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                               FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE order_notes (
                             id              BIGINT AUTO_INCREMENT PRIMARY KEY,
                             order_id        BIGINT         NOT NULL,
                             note            TEXT           NOT NULL,
                             user_id         BIGINT,
                             created_at      TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                             FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
                             id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                             order_id     BIGINT         NOT NULL,
                             product_id   BIGINT         NOT NULL,
                             variant_id   BIGINT         NULL,
                             product_name VARCHAR(150)   NOT NULL,
                             price        DOUBLE         NOT NULL,
                             quantity     INT            NOT NULL,
                             subtotal     DOUBLE         NOT NULL,
                             FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                             FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- ============================================================
-- CARRITO
-- ============================================================

CREATE TABLE cart_items (
                            id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                            product_id   BIGINT         NOT NULL,
                            variant_id   BIGINT         NULL,
                            quantity     INT            NOT NULL,
                            session_id   VARCHAR(255)   NOT NULL,
                            created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                            FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

-- ============================================================
-- wishlist
-- ============================================================
CREATE TABLE wishlist_items (
                                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                                product_id BIGINT NOT NULL,
                                session_id VARCHAR(255) NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
                                UNIQUE KEY unique_wishlist_item (session_id, product_id)
);
-- ============================================================
-- FASE 3.2: LOGÍSTICA Y ENVÍOS
-- ============================================================

CREATE TABLE carriers (
                          id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
                          name                  VARCHAR(100) NOT NULL,
                          code                  VARCHAR(50)  NOT NULL UNIQUE,
                          tracking_url_template VARCHAR(500),
                          is_active             BOOLEAN      NOT NULL DEFAULT TRUE,
                          created_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                          updated_at            TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inserción de Transportadoras por Defecto para Colombia
INSERT INTO carriers (name, code, tracking_url_template) VALUES
                                                             ('Coordinadora', 'COORDINADORA', 'https://www.coordinadora.com/portafolio-de-servicios/servicios-en-linea/rastrear-guias/?guia={trackingNumber}'),
                                                             ('Servientrega', 'SERVIENTREGA', 'https://www.servientrega.com/wps/portal/Colombia/transacciones-personas/rastreo-envios/detalle?tracking={trackingNumber}'),
                                                             ('Inter Rapidísimo', 'INTER_RAPIDISIMO', 'https://www.interrapidisimo.com/sigue-tu-envio/?numeroDeGuia={trackingNumber}'),
                                                             ('Entrega Propia / Otro', 'CUSTOM', null);

CREATE TABLE shipments (
                           id                   BIGINT AUTO_INCREMENT PRIMARY KEY,
                           order_id             BIGINT       NOT NULL,
                           carrier_id           BIGINT       NOT NULL,
                           tracking_number      VARCHAR(100),
                           external_shipment_id VARCHAR(100),
                           status               VARCHAR(50)  NOT NULL DEFAULT 'CREATED',
                           package_number       INT          NOT NULL DEFAULT 1,
                           weight               DOUBLE,
                           dimensions           VARCHAR(50),
                           created_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
                           updated_at           TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                           FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
                           FOREIGN KEY (carrier_id) REFERENCES carriers(id)
);