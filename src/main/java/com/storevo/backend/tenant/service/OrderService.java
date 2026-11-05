package com.storevo.backend.tenant.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.storevo.backend.admin.model.IntegrationType;
import com.storevo.backend.admin.model.Store;
import com.storevo.backend.admin.model.StoreIntegration;
import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.exception.InsufficientStockException;
import com.storevo.backend.tenant.exception.InvalidOrderStatusException;
import com.storevo.backend.tenant.exception.OrderNotFoundException;
import com.storevo.backend.tenant.exception.ShipmentRequiredException;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final CartManager cartManager;
    private final InventoryService inventoryService;
    private final CustomerService customerService;
    private final StoreIntegrationRepository integrationRepository;
    private final com.storevo.backend.admin.repository.StoreRepository storeRepository;
    private final com.storevo.backend.admin.service.StoreSettingsService storeSettingsService;
    private final org.springframework.transaction.PlatformTransactionManager transactionManager;
    private final EmailNotificationService emailNotificationService;
    private final CouponService couponService;

    @Autowired
    @Lazy
    private OrderService self;

    @Transactional(readOnly = true)
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        orders.forEach(order -> order.getItems().size());
        return orders;
    }

    @Transactional(readOnly = true)
    public Page<Order> searchOrders(String q, OrderStatus status, OrderChannel channel, String sortStr, Pageable pageable) {
        return searchOrders(q, status, channel, null, null, null, sortStr, pageable);
    }

    @Transactional(readOnly = true)
    public Page<Order> searchOrders(
            String q,
            OrderStatus status,
            OrderChannel channel,
            String datePreset,
            LocalDate customFrom,
            LocalDate customTo,
            String sortStr,
            Pageable pageable) {

        String term = (q == null) ? "" : q.trim();
        if (term.startsWith("#")) term = term.substring(1).trim();
        Long orderId = null;
        if (term.matches("\\d{1,18}")) orderId = Long.valueOf(term);
        String normalizedQ = term.isEmpty() ? null : term;

        LocalDateTime fromDateTime = null;
        LocalDateTime toDateTime = null;
        LocalDate today = LocalDate.now();

        if (datePreset != null && !datePreset.isBlank()) {
            switch (datePreset.trim().toLowerCase()) {
                case "today":
                    fromDateTime = today.atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "yesterday":
                    LocalDate yesterday = today.minusDays(1);
                    fromDateTime = yesterday.atStartOfDay();
                    toDateTime = yesterday.atTime(LocalTime.MAX);
                    break;
                case "last_7_days":
                    fromDateTime = today.minusDays(6).atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "last_30_days":
                    fromDateTime = today.minusDays(29).atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "this_month":
                    fromDateTime = today.withDayOfMonth(1).atStartOfDay();
                    toDateTime = today.atTime(LocalTime.MAX);
                    break;
                case "custom":
                    if (customFrom != null && customTo != null && customFrom.isAfter(customTo)) {
                        fromDateTime = customTo.atStartOfDay();
                        toDateTime = customFrom.atTime(LocalTime.MAX);
                    } else {
                        if (customFrom != null) fromDateTime = customFrom.atStartOfDay();
                        if (customTo != null) toDateTime = customTo.atTime(LocalTime.MAX);
                    }
                    break;
                default:
                    break;
            }
        }

        Sort sort;
        switch (sortStr == null ? "" : sortStr) {
            case "oldest":     sort = Sort.by("createdAt").ascending().and(Sort.by("id").ascending()); break;
            case "total_desc": sort = Sort.by("total").descending().and(Sort.by("id").descending()); break;
            case "total_asc":  sort = Sort.by("total").ascending().and(Sort.by("id").ascending()); break;
            case "newest":
            default:           sort = Sort.by("createdAt").descending().and(Sort.by("id").descending()); break;
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        Page<Order> page = orderRepository.searchOrders(
                normalizedQ, orderId, status, channel, fromDateTime, toDateTime, sortedPageable);

        page.getContent().forEach(order -> order.getItems().size());
        return page;
    }

    @Transactional(readOnly = true)
    public Order getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new OrderNotFoundException(id));
        order.getItems().size();
        order.getHistory().size();
        order.getInternalNotes().size();
        order.getShipments().size();
        order.getShipments().forEach(shipment -> {
            if (shipment.getCarrier() != null) {
                shipment.getCarrier().getName();
            }
        });
        return order;
    }

    @Transactional(readOnly = true)
    public Order getOrderByPublicToken(String publicToken) {
        if (publicToken == null || publicToken.isBlank()) {
            throw new OrderNotFoundException("vacio");
        }
        Order order = orderRepository.findByPublicToken(publicToken.trim())
                .orElseThrow(() -> new OrderNotFoundException(publicToken));
        order.getItems().size();
        order.getHistory().size();
        order.getInternalNotes().size();
        order.getShipments().size();
        order.getShipments().forEach(shipment -> {
            if (shipment.getCarrier() != null) {
                shipment.getCarrier().getName();
            }
        });
        return order;
    }

    /**
     * Firma original conservada por retrocompatibilidad.
     */
    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerDocument,
            String address,
            String city,
            String notes,
            OrderChannel channel) {

        return createOrderFromCart(
                slug, customerName, customerPhone, null,
                null, customerDocument, null, null, null, false,
                address, city, "SHIPPING", notes, channel
        );
    }

    /**
     * Sobrecarga de 14 parámetros conservada por retrocompatibilidad.
     */
    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerEmail,
            String documentType,
            String customerDocument,
            String verificationDigit,
            String legalName,
            String taxRegime,
            Boolean requiresElectronicInvoice,
            String address,
            String city,
            String notes,
            OrderChannel channel) {

        return createOrderFromCart(
                slug, customerName, customerPhone, customerEmail,
                documentType, customerDocument, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                address, city, "SHIPPING", notes, channel
        );
    }

    /**
     * Crea el pedido calculando y validando en el servidor el subtotal, el costo de envío (o recogida en tienda) y el total final (Objetivo M1).
     */
    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerEmail,
            String documentType,
            String customerDocument,
            String verificationDigit,
            String legalName,
            String taxRegime,
            Boolean requiresElectronicInvoice,
            String address,
            String city,
            String deliveryMethod,
            String notes,
            OrderChannel channel) {

        return createOrderFromCart(
                slug, customerName, customerPhone, customerEmail,
                documentType, customerDocument, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                address, city, deliveryMethod, notes, channel, false
        );
    }

    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerEmail,
            String documentType,
            String customerDocument,
            String verificationDigit,
            String legalName,
            String taxRegime,
            Boolean requiresElectronicInvoice,
            String address,
            String city,
            String deliveryMethod,
            String notes,
            OrderChannel channel,
            boolean onlyInStockItems) {

        return createOrderFromCart(
                slug, customerName, customerPhone, customerEmail,
                documentType, customerDocument, verificationDigit, legalName, taxRegime, requiresElectronicInvoice,
                address, city, deliveryMethod, notes, channel, onlyInStockItems, null
        );
    }

    /**
     * Crea el pedido desde el carrito soportando separación de carritos mixtos y validación/consumo de cupón de descuento.
     */
    @Transactional
    public Order createOrderFromCart(
            String slug,
            String customerName,
            String customerPhone,
            String customerEmail,
            String documentType,
            String customerDocument,
            String verificationDigit,
            String legalName,
            String taxRegime,
            Boolean requiresElectronicInvoice,
            String address,
            String city,
            String deliveryMethod,
            String notes,
            OrderChannel channel,
            boolean onlyInStockItems,
            String couponCode) {

        List<CartItemDto> allCartItems = cartManager.getCart(slug);
        if (allCartItems.isEmpty()) {
            throw new IllegalArgumentException("El carrito está vacío");
        }

        List<CartItemDto> cartItems = onlyInStockItems
                ? allCartItems.stream()
                .filter(dto -> !Boolean.TRUE.equals(dto.getIsMadeToOrder()))
                .collect(Collectors.toList())
                : allCartItems;

        if (cartItems.isEmpty()) {
            throw new IllegalArgumentException("No hay productos con disponibilidad inmediata en tu bolsa para pagar en línea.");
        }

        com.storevo.backend.tenant.dto.StoreSettingsDto storeSettings = loadStoreSettingsForCurrentTenant();

        boolean pickupRequested = "PICKUP".equalsIgnoreCase(deliveryMethod != null ? deliveryMethod.trim() : "");
        boolean pickupAllowed = storeSettings != null && Boolean.TRUE.equals(storeSettings.getAllowStorePickup());
        String resolvedDeliveryMethod = (pickupRequested && pickupAllowed) ? "PICKUP" : "SHIPPING";

        String resolvedCity = (city != null && !city.isBlank()) ? city.trim() : "";
        String resolvedAddress = (address != null && !address.isBlank()) ? address.trim() : "";

        if ("PICKUP".equals(resolvedDeliveryMethod)) {
            if (resolvedCity.isEmpty()) {
                resolvedCity = (storeSettings != null && storeSettings.getShippingPickupCity() != null && !storeSettings.getShippingPickupCity().isBlank())
                        ? storeSettings.getShippingPickupCity().trim()
                        : "Recogida en tienda";
            }
            if (resolvedAddress.isEmpty()) {
                resolvedAddress = (storeSettings != null && storeSettings.getShippingPickupAddress() != null && !storeSettings.getShippingPickupAddress().isBlank())
                        ? "Recogida en tienda (" + storeSettings.getShippingPickupAddress().trim() + ")"
                        : "Recogida en tienda física";
            }
        } else {
            if (resolvedCity.isEmpty() || resolvedAddress.isEmpty()) {
                throw new IllegalArgumentException("Debes indicar la ciudad y la dirección de entrega para el envío a domicilio.");
            }
        }

        String initialPaymentMethod = channel == OrderChannel.WHATSAPP ? "Pendiente por WhatsApp" : "Wompi / Tarjeta";

        Order order = Order.builder()
                .customerName(customerName != null ? customerName.trim() : "")
                .customerPhone(customerPhone != null ? customerPhone.trim() : "")
                .customerEmail(cleanNullable(customerEmail))
                .documentType(cleanNullable(documentType))
                .customerDocument(cleanNullable(customerDocument))
                .verificationDigit(cleanNullable(verificationDigit))
                .legalName(cleanNullable(legalName))
                .taxRegime(cleanNullable(taxRegime))
                .requiresElectronicInvoice(Boolean.TRUE.equals(requiresElectronicInvoice))
                .address(resolvedAddress)
                .city(resolvedCity)
                .notes(cleanNullable(notes))
                .subtotal(0.0)
                .shippingCost(0.0)
                .deliveryMethod(resolvedDeliveryMethod)
                .total(0.0)
                .status(OrderStatus.PENDING)
                .channel(channel)
                .paymentMethod(initialPaymentMethod)
                .stockDeducted(false)
                .build();

        List<OrderItem> items = cartItems.stream().map(dto -> {
            if (dto.getProductId() == null || dto.getQuantity() == null || dto.getQuantity() <= 0) {
                throw new IllegalArgumentException("Datos de producto o cantidad inválidos en el carrito.");
            }

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Uno de los productos de tu bolsa ya no existe."));

            if (Boolean.TRUE.equals(product.getIsDeleted())
                    || !Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDraft())) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' ya no está disponible.");
            }

            ProductVariant variant = null;
            Long verifiedVariantId = null;

            if (Boolean.TRUE.equals(product.getHasVariants())) {
                if (dto.getVariantId() == null) {
                    throw new IllegalArgumentException("Debes seleccionar una variante válida para el producto: " + product.getName());
                }
                variant = variantRepository.findByIdAndProductId(dto.getVariantId(), product.getId())
                        .orElseThrow(() -> new IllegalArgumentException("La variante seleccionada no pertenece al producto: " + product.getName()));

                if (!Boolean.TRUE.equals(variant.getIsActive())) {
                    throw new IllegalArgumentException("La variante seleccionada para '" + product.getName() + "' no está disponible.");
                }
                verifiedVariantId = variant.getId();
            } else if (dto.getVariantId() != null) {
                throw new IllegalArgumentException("La variante seleccionada no pertenece al producto: " + product.getName());
            }

            Double verifiedPrice = cartManager.resolveEffectivePrice(product, variant);
            if (verifiedPrice == null || verifiedPrice <= 0.0) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' no tiene un precio válido.");
            }

            String verifiedVariantText = variant != null ? cartManager.buildVariantText(variant) : null;
            if ((verifiedVariantText == null || verifiedVariantText.isBlank())
                    && dto.getVariantText() != null && !dto.getVariantText().isBlank()) {
                verifiedVariantText = dto.getVariantText().trim();
            }

            if (!inventoryService.isAvailable(product.getId(), verifiedVariantId, dto.getQuantity())) {
                String finalName = product.getName() + (verifiedVariantText != null ? " (" + verifiedVariantText + ")" : "");
                throw new InsufficientStockException(finalName);
            }

            String receiptName = product.getName() + (verifiedVariantText != null ? " - " + verifiedVariantText : "");
            double verifiedItemSubtotal = verifiedPrice * dto.getQuantity();

            return OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .variantId(verifiedVariantId)
                    .productName(receiptName)
                    .price(verifiedPrice)
                    .quantity(dto.getQuantity())
                    .subtotal(verifiedItemSubtotal)
                    .build();
        }).collect(Collectors.toList());

        double verifiedSubtotal = items.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        if (Double.isNaN(verifiedSubtotal) || Double.isInfinite(verifiedSubtotal) || verifiedSubtotal <= 0.0) {
            throw new IllegalArgumentException("El subtotal de los productos no es válido.");
        }

        String appliedCouponCode = null;
        double appliedDiscountAmount = 0.0;
        if (couponCode != null && !couponCode.isBlank()) {
            CouponService.CouponEvaluation eval = couponService.consumeCouponForOrder(couponCode, verifiedSubtotal);
            if (eval != null) {
                appliedCouponCode = eval.code();
                appliedDiscountAmount = eval.discountAmount();
            }
        }

        double discountedSubtotal = Math.max(0.0, verifiedSubtotal - appliedDiscountAmount);
        double verifiedShippingCost = storeSettingsService.calculateShippingCost(
                storeSettings, discountedSubtotal, resolvedCity, resolvedDeliveryMethod);

        double verifiedOrderTotal = discountedSubtotal + verifiedShippingCost;

        order.setSubtotal(verifiedSubtotal);
        order.setCouponCode(appliedCouponCode);
        order.setDiscountAmount(appliedDiscountAmount);
        order.setShippingCost(verifiedShippingCost);
        order.setTotal(verifiedOrderTotal);
        order.setItems(items);

        String historyDescription = channel == OrderChannel.WHATSAPP
                ? "Pedido creado por el cliente y enviado por WhatsApp para confirmación."
                : "Pedido creado por el cliente.";

        OrderHistory historyObj = OrderHistory.builder()
                .order(order)
                .eventType(OrderHistoryType.SYSTEM_EVENT)
                .origin(EventOrigin.WEB)
                .oldStatus(null)
                .newStatus(OrderStatus.PENDING)
                .description(historyDescription)
                .userId(null)
                .build();

        order.getHistory().add(historyObj);

        Customer customer = customerService.syncCustomerOnOrderCreated(order);
        order.setCustomer(customer);

        Order savedOrder = orderRepository.save(order);

        if (onlyInStockItems) {
            for (CartItemDto processedDto : cartItems) {
                cartManager.removeItem(slug, processedDto.getProductId(), processedDto.getVariantId());
            }
        } else {
            cartManager.clearCart(slug);
        }

        triggerOrderEmailsSafely(savedOrder, storeSettings);

        return savedOrder;
    }

    /**
     * Cancela un pedido ONLINE que aún está en estado PENDING y restaura sus ítems a la bolsa normal del visitante.
     */
    @Transactional
    public void cancelPendingOrderAndRestoreToCart(String publicToken, String guestId) {
        Order order = getOrderByPublicToken(publicToken);

        if (order.getStatus() != OrderStatus.PENDING || order.getChannel() != OrderChannel.ONLINE) {
            throw new IllegalStateException("Este pedido ya no puede modificarse porque no está pendiente de pago en línea.");
        }

        if (guestId != null && !guestId.isBlank() && order.getItems() != null) {
            String normalSessionId = guestId.endsWith(":direct")
                    ? guestId.substring(0, guestId.length() - ":direct".length())
                    : guestId;

            List<CartItemDto> currentCart = cartManager.getCart(normalSessionId);

            for (OrderItem item : order.getItems()) {
                if (item == null || item.getProductId() == null || item.getQuantity() == null || item.getQuantity() <= 0) {
                    continue;
                }
                Product product = productRepository.findById(item.getProductId()).orElse(null);
                if (product == null
                        || Boolean.TRUE.equals(product.getIsDeleted())
                        || !Boolean.TRUE.equals(product.getIsActive())
                        || Boolean.TRUE.equals(product.getIsDraft())) {
                    continue;
                }

                Long targetVariantId = item.getVariantId();
                if (Boolean.TRUE.equals(product.getHasVariants())) {
                    if (targetVariantId == null) continue;
                    ProductVariant variant = variantRepository.findByIdAndProductId(targetVariantId, product.getId()).orElse(null);
                    if (variant == null || !Boolean.TRUE.equals(variant.getIsActive())) {
                        continue;
                    }
                } else {
                    targetVariantId = null;
                }

                final Long checkProdId = product.getId();
                final Long checkVarId = targetVariantId;
                boolean alreadyInCart = currentCart.stream().anyMatch(c ->
                        checkProdId.equals(c.getProductId())
                                && java.util.Objects.equals(checkVarId, c.getVariantId()));

                try {
                    if (alreadyInCart) {
                        cartManager.removeItem(normalSessionId, checkProdId, checkVarId);
                    }
                    CartItemDto restoreDto = CartItemDto.builder()
                            .productId(checkProdId)
                            .variantId(checkVarId)
                            .quantity(item.getQuantity())
                            .build();
                    cartManager.addItem(normalSessionId, restoreDto);
                } catch (Exception ignored) {
                    // Si el producto cambió de condiciones mientras tanto, omitirlo sin bloquear la cancelación
                }
            }
        }

        updateOrderStatus(
                order.getId(),
                OrderStatus.CANCELLED,
                EventOrigin.WEB,
                null,
                "Pedido cancelado por el comprador para modificar su bolsa"
        );
    }

    private com.storevo.backend.tenant.dto.StoreSettingsDto loadStoreSettingsForCurrentTenant() {
        String currentSchema = TenantContext.getCurrentTenant();
        if (currentSchema == null || currentSchema.isBlank() || TenantContext.DEFAULT_TENANT.equalsIgnoreCase(currentSchema)) {
            return null;
        }
        try {
            // Las tablas stores/store_settings viven en storevo_admin. La transacción actual está atada al esquema
            // de la tienda, así que abrimos una transacción NUEVA y de solo lectura contra el esquema admin.
            TenantContext.clear();
            org.springframework.transaction.support.TransactionTemplate template =
                    new org.springframework.transaction.support.TransactionTemplate(transactionManager);
            template.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            template.setReadOnly(true);
            return template.execute(status -> {
                Store store = storeRepository.findBySchemaName(currentSchema).orElse(null);
                return (store != null) ? storeSettingsService.getSettingsByStore(store) : null;
            });
        } catch (Exception e) {
            // Fallar fuerte: si no podemos leer la configuración, es mejor detener el pedido que cobrar envío $0 en silencio.
            throw new IllegalStateException("No se pudo cargar la configuración de envío de la tienda: " + e.getMessage(), e);
        } finally {
            TenantContext.setCurrentTenant(currentSchema);
        }
    }

    private String cleanNullable(String value) {
        return (value != null && !value.isBlank()) ? value.trim() : null;
    }

    /**
     * Crea un pedido manual / venta asistida desde el panel administrativo (Objetivo M2).
     */
    @Transactional
    public Order createManualOrder(com.storevo.backend.tenant.dto.ManualOrderRequestDto req, Long adminUserId) {
        if (req == null || req.getItems() == null || req.getItems().isEmpty()) {
            throw new IllegalArgumentException("Debes agregar al menos un producto al pedido.");
        }
        if (req.getCustomerName() == null || req.getCustomerName().isBlank()) {
            throw new IllegalArgumentException("El nombre del cliente es obligatorio.");
        }
        if (req.getCustomerPhone() == null || req.getCustomerPhone().isBlank()) {
            throw new IllegalArgumentException("El teléfono / WhatsApp del cliente es obligatorio.");
        }

        com.storevo.backend.tenant.dto.StoreSettingsDto storeSettings = loadStoreSettingsForCurrentTenant();

        boolean pickupRequested = "PICKUP".equalsIgnoreCase(req.getDeliveryMethod() != null ? req.getDeliveryMethod().trim() : "");
        String resolvedDeliveryMethod = pickupRequested ? "PICKUP" : "SHIPPING";

        String resolvedCity = (req.getCity() != null && !req.getCity().isBlank()) ? req.getCity().trim() : "";
        String resolvedAddress = (req.getAddress() != null && !req.getAddress().isBlank()) ? req.getAddress().trim() : "";

        if ("PICKUP".equals(resolvedDeliveryMethod)) {
            if (resolvedCity.isEmpty()) {
                resolvedCity = (storeSettings != null && storeSettings.getShippingPickupCity() != null && !storeSettings.getShippingPickupCity().isBlank())
                        ? storeSettings.getShippingPickupCity().trim()
                        : "Recogida en tienda";
            }
            if (resolvedAddress.isEmpty()) {
                resolvedAddress = (storeSettings != null && storeSettings.getShippingPickupAddress() != null && !storeSettings.getShippingPickupAddress().isBlank())
                        ? "Recogida en tienda (" + storeSettings.getShippingPickupAddress().trim() + ")"
                        : "Recogida en tienda física";
            }
        } else {
            if (resolvedCity.isEmpty() || resolvedAddress.isEmpty()) {
                throw new IllegalArgumentException("Debes indicar la ciudad y la dirección de entrega para el envío a domicilio.");
            }
        }

        OrderChannel resolvedChannel = "ONLINE".equalsIgnoreCase(req.getChannel() != null ? req.getChannel().trim() : "")
                ? OrderChannel.ONLINE
                : OrderChannel.WHATSAPP;

        OrderStatus targetInitialStatus = OrderStatus.PENDING;
        if ("PAID".equalsIgnoreCase(req.getInitialStatus())) {
            targetInitialStatus = OrderStatus.PAID;
        } else if ("CONFIRMED".equalsIgnoreCase(req.getInitialStatus())) {
            targetInitialStatus = OrderStatus.CONFIRMED;
        }

        String resolvedPaymentMethod = cleanNullable(req.getPaymentMethod());
        if (resolvedPaymentMethod == null) {
            if (targetInitialStatus == OrderStatus.PAID) {
                resolvedPaymentMethod = "Pago registrado en panel";
            } else if (targetInitialStatus == OrderStatus.CONFIRMED) {
                resolvedPaymentMethod = "Contraentrega / WhatsApp";
            } else {
                resolvedPaymentMethod = "Link de pago / Pendiente";
            }
        }

        String finalDoc = cleanNullable(req.getCustomerDocument());
        String cleanDv = cleanNullable(req.getVerificationDigit());
        if (finalDoc != null && cleanDv != null && !finalDoc.contains("-")) {
            finalDoc = finalDoc + "-" + cleanDv;
        }

        // Consolidar cantidades por (productId, variantId) para evitar duplicados en la misma orden
        java.util.Map<String, com.storevo.backend.tenant.dto.ManualOrderRequestDto.ManualOrderItemDto> mergedItemsMap = new java.util.LinkedHashMap<>();
        for (com.storevo.backend.tenant.dto.ManualOrderRequestDto.ManualOrderItemDto rawItem : req.getItems()) {
            if (rawItem == null || rawItem.getProductId() == null || rawItem.getQuantity() == null || rawItem.getQuantity() <= 0) {
                throw new IllegalArgumentException("Cada producto del pedido debe tener una cantidad mayor a cero.");
            }
            String key = rawItem.getProductId() + ":" + (rawItem.getVariantId() != null ? rawItem.getVariantId() : "null");
            com.storevo.backend.tenant.dto.ManualOrderRequestDto.ManualOrderItemDto existing = mergedItemsMap.get(key);
            if (existing != null) {
                existing.setQuantity(existing.getQuantity() + rawItem.getQuantity());
            } else {
                mergedItemsMap.put(key, com.storevo.backend.tenant.dto.ManualOrderRequestDto.ManualOrderItemDto.builder()
                        .productId(rawItem.getProductId())
                        .variantId(rawItem.getVariantId())
                        .quantity(rawItem.getQuantity())
                        .build());
            }
        }

        boolean deductImmediately = (targetInitialStatus == OrderStatus.PAID || targetInitialStatus == OrderStatus.CONFIRMED);

        Order order = Order.builder()
                .customerName(req.getCustomerName().trim())
                .customerPhone(req.getCustomerPhone().trim())
                .customerEmail(cleanNullable(req.getCustomerEmail()))
                .documentType(cleanNullable(req.getDocumentType()))
                .customerDocument(finalDoc)
                .verificationDigit(cleanDv)
                .legalName(cleanNullable(req.getLegalName()))
                .taxRegime(cleanNullable(req.getTaxRegime()))
                .requiresElectronicInvoice(Boolean.TRUE.equals(req.getRequiresElectronicInvoice()))
                .address(resolvedAddress)
                .city(resolvedCity)
                .notes(cleanNullable(req.getNotes()))
                .subtotal(0.0)
                .shippingCost(0.0)
                .deliveryMethod(resolvedDeliveryMethod)
                .total(0.0)
                .status(targetInitialStatus)
                .channel(resolvedChannel)
                .paymentMethod(resolvedPaymentMethod)
                .stockDeducted(deductImmediately)
                .build();

        List<OrderItem> orderItems = new java.util.ArrayList<>();
        for (com.storevo.backend.tenant.dto.ManualOrderRequestDto.ManualOrderItemDto itemDto : mergedItemsMap.values()) {
            Product product = productRepository.findById(itemDto.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado (ID: " + itemDto.getProductId() + ")."));

            if (Boolean.TRUE.equals(product.getIsDeleted())
                    || !Boolean.TRUE.equals(product.getIsActive())
                    || Boolean.TRUE.equals(product.getIsDraft())) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' no está activo ni disponible para la venta.");
            }

            ProductVariant variant = null;
            Long verifiedVariantId = null;

            if (Boolean.TRUE.equals(product.getHasVariants())) {
                if (itemDto.getVariantId() == null) {
                    throw new IllegalArgumentException("Debes elegir una variante (talla/color) para el producto: " + product.getName());
                }
                variant = variantRepository.findByIdAndProductId(itemDto.getVariantId(), product.getId())
                        .orElseThrow(() -> new IllegalArgumentException("La variante seleccionada no pertenece al producto: " + product.getName()));

                if (!Boolean.TRUE.equals(variant.getIsActive())) {
                    throw new IllegalArgumentException("La variante seleccionada para '" + product.getName() + "' está inactiva.");
                }
                verifiedVariantId = variant.getId();
            } else if (itemDto.getVariantId() != null) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' no utiliza variantes.");
            }

            Double verifiedPrice = cartManager.resolveEffectivePrice(product, variant);
            if (verifiedPrice == null || verifiedPrice <= 0.0) {
                throw new IllegalArgumentException("El producto '" + product.getName() + "' no tiene un precio válido.");
            }

            String variantText = variant != null ? cartManager.buildVariantText(variant) : null;
            String displayName = product.getName() + (variantText != null ? " (" + variantText + ")" : "");

            if (!inventoryService.isAvailable(product.getId(), verifiedVariantId, itemDto.getQuantity())) {
                throw new InsufficientStockException(displayName);
            }

            if (deductImmediately) {
                inventoryService.deductStock(product.getId(), verifiedVariantId, itemDto.getQuantity());
            }

            String receiptName = product.getName() + (variantText != null ? " - " + variantText : "");
            double itemSubtotal = verifiedPrice * itemDto.getQuantity();

            orderItems.add(OrderItem.builder()
                    .order(order)
                    .productId(product.getId())
                    .variantId(verifiedVariantId)
                    .productName(receiptName)
                    .price(verifiedPrice)
                    .quantity(itemDto.getQuantity())
                    .subtotal(itemSubtotal)
                    .build());
        }

        double verifiedSubtotal = orderItems.stream()
                .mapToDouble(OrderItem::getSubtotal)
                .sum();

        if (Double.isNaN(verifiedSubtotal) || Double.isInfinite(verifiedSubtotal) || verifiedSubtotal <= 0.0) {
            throw new IllegalArgumentException("El subtotal del pedido no es válido.");
        }

        double verifiedShippingCost;
        if ("PICKUP".equals(resolvedDeliveryMethod)) {
            verifiedShippingCost = 0.0;
        } else if (req.getCustomShippingCost() != null
                && !Double.isNaN(req.getCustomShippingCost())
                && !Double.isInfinite(req.getCustomShippingCost())
                && req.getCustomShippingCost() >= 0.0) {
            verifiedShippingCost = req.getCustomShippingCost();
        } else {
            verifiedShippingCost = storeSettingsService.calculateShippingCost(
                    storeSettings, verifiedSubtotal, resolvedCity, resolvedDeliveryMethod);
        }

        order.setSubtotal(verifiedSubtotal);
        order.setShippingCost(verifiedShippingCost);
        order.setTotal(verifiedSubtotal + verifiedShippingCost);
        order.setItems(orderItems);

        String statusExplanation = switch (targetInitialStatus) {
            case PAID -> "Pedido creado manualmente desde el panel como PAGADO (" + resolvedPaymentMethod + ").";
            case CONFIRMED -> "Pedido creado manualmente desde el panel como CONFIRMADO (" + resolvedPaymentMethod + ").";
            default -> "Pedido creado manualmente desde el panel (Pendiente de pago — Link de cobro generado).";
        };

        OrderHistory historyObj = OrderHistory.builder()
                .order(order)
                .eventType(OrderHistoryType.STATE_CHANGE)
                .origin(EventOrigin.ADMIN)
                .oldStatus(null)
                .newStatus(targetInitialStatus)
                .description(statusExplanation)
                .userId(adminUserId)
                .build();

        order.getHistory().add(historyObj);

        Customer customer = customerService.syncCustomerOnOrderCreated(order);
        order.setCustomer(customer);

        Order savedOrder = orderRepository.save(order);
        triggerOrderEmailsSafely(savedOrder, storeSettings);
        return savedOrder;
    }

    private Store loadStoreForCurrentTenant() {
        String currentSchema = TenantContext.getCurrentTenant();
        if (currentSchema == null || currentSchema.isBlank() || TenantContext.DEFAULT_TENANT.equalsIgnoreCase(currentSchema)) {
            return null;
        }
        try {
            TenantContext.clear();
            org.springframework.transaction.support.TransactionTemplate template =
                    new org.springframework.transaction.support.TransactionTemplate(transactionManager);
            template.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
            template.setReadOnly(true);
            return template.execute(status -> storeRepository.findBySchemaName(currentSchema).orElse(null));
        } catch (Exception e) {
            return null;
        } finally {
            TenantContext.setCurrentTenant(currentSchema);
        }
    }

    private void triggerOrderEmailsSafely(Order savedOrder, com.storevo.backend.tenant.dto.StoreSettingsDto settings) {
        if (savedOrder == null) return;
        try {
            if (savedOrder.getItems() != null) {
                savedOrder.getItems().forEach(OrderItem::getProductName);
            }
            Store currentStore = loadStoreForCurrentTenant();
            com.storevo.backend.tenant.dto.StoreSettingsDto resolvedSettings = (settings != null)
                    ? settings
                    : loadStoreSettingsForCurrentTenant();
            emailNotificationService.sendOrderConfirmationToCustomer(currentStore, resolvedSettings, savedOrder);
            emailNotificationService.sendNewOrderAlertToMerchant(currentStore, resolvedSettings, savedOrder);
        } catch (Exception ignored) {
            // El envío de correo nunca debe afectar la transacción del pedido
        }
    }

    /**
     * Construye el mensaje de cobro con el resumen del pedido y el link directo de pago para enviar por WhatsApp al comprador (Objetivo M2).
     */
    public String buildPaymentLinkWhatsappMessage(Order order, String storeName, String paymentUrl) {
        String safeStore = (storeName != null && !storeName.isBlank()) ? storeName.trim() : "nuestra tienda";
        StringBuilder sb = new StringBuilder();
        sb.append("¡Hola ").append(order.getCustomerName()).append("! Te compartimos el resumen de tu *Pedido #")
                .append(order.getId()).append("* en *").append(safeStore).append("*:\n\n");

        for (OrderItem item : order.getItems()) {
            sb.append("• ").append(item.getQuantity()).append("x ").append(item.getProductName());
            if (item.getSubtotal() != null) {
                sb.append(" ($").append(formatCurrency(item.getSubtotal())).append(")");
            }
            sb.append("\n");
        }

        double sub = (order.getSubtotal() != null && order.getSubtotal() > 0.0)
                ? order.getSubtotal()
                : (order.getTotal() != null ? order.getTotal() : 0.0);
        double ship = (order.getShippingCost() != null && order.getShippingCost() >= 0.0)
                ? order.getShippingCost()
                : 0.0;
        boolean isPickup = "PICKUP".equalsIgnoreCase(order.getDeliveryMethod());

        double disc = (order.getDiscountAmount() != null && order.getDiscountAmount() > 0.0)
                ? order.getDiscountAmount()
                : 0.0;

        sb.append("\n*Subtotal:* $").append(formatCurrency(sub));
        if (disc > 0.0) {
            String codeLabel = (order.getCouponCode() != null && !order.getCouponCode().isBlank())
                    ? " (" + order.getCouponCode() + ")" : "";
            sb.append("\n*Descuento").append(codeLabel).append(":* -$").append(formatCurrency(disc));
        }
        if (isPickup) {
            sb.append("\n*Entrega:* Recogida en tienda ($0)");
        } else if (ship > 0.0) {
            sb.append("\n*Envío a domicilio:* $").append(formatCurrency(ship));
        } else {
            sb.append("\n*Envío:* Gratis ($0)");
        }
        sb.append("\n*Total a pagar:* $").append(formatCurrency(order.getTotal())).append("\n");

        if (order.getStatus() == OrderStatus.PENDING && paymentUrl != null && !paymentUrl.isBlank()) {
            sb.append("\nPuedes completar tu pago en línea de forma segura en este enlace:\n").append(paymentUrl);
        } else {
            sb.append("\n*Estado del pedido:* ").append(order.getStatus().getDisplayName());
        }

        return sb.toString();
    }

    public String buildWhatsappMessage(Order order) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hola, quiero realizar el *Pedido #").append(order.getId()).append("*:").append("\n\n");

        for (OrderItem item : order.getItems()) {
            sb.append("• ").append(item.getQuantity()).append("x ").append(item.getProductName());
            if (item.getSubtotal() != null) {
                sb.append(" ($").append(formatCurrency(item.getSubtotal())).append(")");
            }
            sb.append("\n");
        }

        double sub = (order.getSubtotal() != null && order.getSubtotal() > 0.0)
                ? order.getSubtotal()
                : (order.getTotal() != null ? order.getTotal() : 0.0);
        double disc = (order.getDiscountAmount() != null && order.getDiscountAmount() > 0.0)
                ? order.getDiscountAmount()
                : 0.0;
        double ship = (order.getShippingCost() != null && order.getShippingCost() >= 0.0)
                ? order.getShippingCost()
                : 0.0;
        boolean isPickup = "PICKUP".equalsIgnoreCase(order.getDeliveryMethod());

        sb.append("\n*Subtotal productos:* $").append(formatCurrency(sub));
        if (disc > 0.0) {
            String codeLabel = (order.getCouponCode() != null && !order.getCouponCode().isBlank())
                    ? " (Cupón " + order.getCouponCode() + ")" : "";
            sb.append("\n*Descuento").append(codeLabel).append(":* -$").append(formatCurrency(disc));
        }
        if (isPickup) {
            sb.append("\n*Entrega:* Recogida en tienda ($0)");
        } else if (ship > 0.0) {
            sb.append("\n*Envío a domicilio:* $").append(formatCurrency(ship));
        } else {
            sb.append("\n*Envío:* Gratis / Por confirmar ($0)");
        }
        sb.append("\n*Total a pagar:* $").append(formatCurrency(order.getTotal())).append("\n");

        sb.append("\n*Datos de entrega:*");
        sb.append("\n• Modalidad: ").append(isPickup ? "Recoger en tienda física" : "Envío a domicilio");
        sb.append("\n• Cliente: ").append(order.getCustomerName());
        if (order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()) {
            sb.append("\n• Teléfono: ").append(order.getCustomerPhone());
        }
        if (order.getCustomerDocument() != null && !order.getCustomerDocument().isBlank()) {
            String docPrefix = (order.getDocumentType() != null && !order.getDocumentType().isBlank())
                    ? order.getDocumentType() + " " : "";
            sb.append("\n• Documento: ").append(docPrefix).append(order.getCustomerDocument());
        }
        if (Boolean.TRUE.equals(order.getRequiresElectronicInvoice()) && order.getLegalName() != null) {
            sb.append("\n• Factura Electrónica a: ").append(order.getLegalName());
        }
        if (order.getCity() != null && !order.getCity().isBlank()) {
            sb.append("\n• Ciudad: ").append(order.getCity());
        }
        if (order.getAddress() != null && !order.getAddress().isBlank()) {
            sb.append("\n• Dirección: ").append(order.getAddress());
        }
        if (order.getNotes() != null && !order.getNotes().isBlank()) {
            sb.append("\n• Notas: ").append(order.getNotes());
        }

        sb.append("\n\n¿Me confirman disponibilidad y datos para finalizar?");
        return sb.toString();
    }

    private String formatCurrency(Double amount) {
        if (amount == null) return "0";
        long rounded = Math.round(amount);
        return String.format("%,d", rounded).replace(",", ".");
    }

    @Transactional
    public OrderHistory updateOrderStatus(Long orderId, OrderStatus newStatus, EventOrigin origin, Long userId) {
        return updateOrderStatus(orderId, newStatus, origin, userId, null);
    }

    @Transactional
    public OrderHistory updateOrderStatus(Long orderId, OrderStatus newStatus, EventOrigin origin, Long userId, String customDescription) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));
        OrderStatus oldStatus = order.getStatus();

        // Idempotencia ante llegada simultánea de Webhook y retorno web
        if (oldStatus == newStatus) {
            return order.getHistory().isEmpty() ? null : order.getHistory().get(0);
        }

        if (!oldStatus.canTransitionTo(newStatus)) {
            throw new InvalidOrderStatusException(oldStatus, newStatus);
        }

        if (newStatus == OrderStatus.SHIPPED && order.getShipments().isEmpty()) {
            throw new ShipmentRequiredException(orderId);
        }

        // 1. Descontar stock al pasar por primera vez a PAID o CONFIRMED
        if ((newStatus == OrderStatus.PAID || newStatus == OrderStatus.CONFIRMED)
                && !Boolean.TRUE.equals(order.getStockDeducted())) {

            if (newStatus == OrderStatus.PAID && origin == EventOrigin.WEBHOOK) {
                // Si el pago ya fue cobrado por Wompi, descontamos de forma segura sin perder el estado PAID
                java.util.List<String> stockWarnings = deductOrderStockSafely(order);
                if (!stockWarnings.isEmpty()) {
                    OrderHistory alertHistory = OrderHistory.builder()
                            .order(order)
                            .eventType(OrderHistoryType.SYSTEM_EVENT)
                            .origin(origin)
                            .oldStatus(oldStatus)
                            .newStatus(newStatus)
                            .description("ALERTA CRÍTICA DE INVENTARIO: Pago aprobado pero sin stock suficiente para: "
                                    + String.join(", ", stockWarnings) + ". Verificar cumplimiento o reembolso con el cliente.")
                            .userId(userId)
                            .build();
                    order.getHistory().add(alertHistory);
                }
            } else {
                // En confirmación manual (ej. pedido WhatsApp en el Dashboard), exigir stock real con bloqueo pesimista
                deductOrderStock(order);
                order.setStockDeducted(true);
            }
        }

        // 2. Restaurar stock al pasar a CANCELLED o REFUNDED únicamente si ya había sido descontado
        if ((newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED)
                && Boolean.TRUE.equals(order.getStockDeducted())) {
            restoreOrderStock(order);
            order.setStockDeducted(false);
        }

        order.setStatus(newStatus);

        String resolvedDescription = (customDescription != null && !customDescription.isBlank())
                ? customDescription.trim()
                : "El estado cambió a " + newStatus.getDisplayName();

        OrderHistory historyObj = OrderHistory.builder()
                .order(order)
                .eventType(OrderHistoryType.STATE_CHANGE)
                .origin(origin)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .description(resolvedDescription)
                .userId(userId)
                .build();

        order.getHistory().add(historyObj);
        Order savedOrder = orderRepository.save(order);

        if ((newStatus == OrderStatus.CANCELLED || newStatus == OrderStatus.REFUNDED)
                && savedOrder.getCustomer() != null) {
            customerService.recalculateCustomerMetrics(savedOrder.getCustomer());
        }

        if (newStatus == OrderStatus.PAID && oldStatus != OrderStatus.PAID) {
            triggerOrderEmailsSafely(savedOrder, null);
        }

        return historyObj;
    }

    @Transactional
    public void recordPaymentAttemptFailure(Long orderId, String wompiTransactionId, String wompiStatus) {
        Order order = orderRepository.findById(orderId).orElse(null);
        if (order == null || order.getStatus() != OrderStatus.PENDING) return;

        String safeTxId = (wompiTransactionId != null && !wompiTransactionId.isBlank()) ? wompiTransactionId : "N/A";
        String txDesc = "Intento de pago en Wompi no completado (" + wompiStatus + "). ID Transacción: " + safeTxId;
        boolean alreadyRecorded = order.getHistory().stream()
                .anyMatch(h -> txDesc.equals(h.getDescription()));

        if (!alreadyRecorded) {
            OrderHistory historyObj = OrderHistory.builder()
                    .order(order)
                    .eventType(OrderHistoryType.SYSTEM_EVENT)
                    .origin(EventOrigin.WEBHOOK)
                    .oldStatus(order.getStatus())
                    .newStatus(order.getStatus())
                    .description(txDesc)
                    .userId(null)
                    .build();
            order.getHistory().add(historyObj);
            orderRepository.save(order);
        }
    }

    @Transactional
    public OrderNote addInternalNote(Long orderId, String note, Long userId) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new OrderNotFoundException(orderId));

        OrderNote internalNote = OrderNote.builder()
                .order(order)
                .note(note)
                .userId(userId)
                .build();

        order.getInternalNotes().add(internalNote);
        orderRepository.save(order);
        return internalNote;
    }

    private java.util.List<InventoryService.StockLine> buildStockLines(Order order) {
        java.util.List<InventoryService.StockLine> lines = new java.util.ArrayList<>();
        for (OrderItem item : order.getItems()) {
            lines.add(new InventoryService.StockLine(
                    item.getProductId(),
                    item.getVariantId(),
                    item.getQuantity() != null ? item.getQuantity() : 0,
                    item.getProductName() + " (x" + item.getQuantity() + ")"));
        }
        return lines;
    }

    /**
     * Confirmación manual: descuenta TODO o NADA aplicando las reglas del catálogo.
     * Si falta stock lanza la excepción (la transacción completa se revierte y no queda nada a medias).
     */
    private void deductOrderStock(Order order) {
        java.util.List<String> failures = inventoryService.tryDeductAll(buildStockLines(order), true);
        if (!failures.isEmpty()) {
            throw new InsufficientStockException("Stock insuficiente para: " + String.join(", ", failures));
        }
    }

    /**
     * Pago ya cobrado por Wompi: NUNCA lanza excepción (así el pedido sí queda en PAID).
     * Descuenta TODO o NADA. Si algo no alcanza, no descuenta nada, deja stockDeducted=false
     * y devuelve la lista de ítems con problema para registrar la alerta en el historial.
     */
    private java.util.List<String> deductOrderStockSafely(Order order) {
        java.util.List<String> failures = inventoryService.tryDeductAll(buildStockLines(order), false);
        order.setStockDeducted(failures.isEmpty());
        return failures;
    }

    private void restoreOrderStock(Order order) {
        for (OrderItem item : order.getItems()) {
            inventoryService.restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }
    }

    public String verifyTransactionWithWompi(Store store, Long orderId, String wompiTransactionId) {
        try {
            TenantContext.setCurrentTenant(store.getSchemaName());
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                return "INVALID";
            }
            if (order.getStatus() == OrderStatus.PAID) {
                return "APPROVED";
            }
            if (wompiTransactionId == null || wompiTransactionId.isBlank()) {
                return "PENDING";
            }
            if (order.getStatus() != OrderStatus.PENDING) {
                return order.getStatus().name();
            }

            TenantContext.clear();

            StoreIntegration wompiConfig = integrationRepository
                    .findByStoreAndIntegrationTypeAndIsActiveTrue(
                            store,
                            IntegrationType.WOMPI
                    )
                    .orElse(null);

            if (wompiConfig == null) {
                return "PENDING";
            }

            TenantContext.setCurrentTenant(store.getSchemaName());

            String baseUrl = "PRODUCTION".equals(wompiConfig.getEnvironment())
                    ? "https://production.wompi.co/v1/transactions/"
                    : "https://sandbox.wompi.co/v1/transactions/";

            RestTemplate restTemplate = new RestTemplate();

            ResponseEntity<JsonNode> response = restTemplate.getForEntity(
                    baseUrl + wompiTransactionId,
                    JsonNode.class
            );

            if (response.getBody() != null && response.getStatusCode().is2xxSuccessful()) {
                JsonNode data = response.getBody().get("data");
                if (data == null || !data.has("status")) {
                    return "INVALID";
                }

                // La referencia debe ser EXACTAMENTE la que Storevo generó para este pedido (incluye el token privado)
                String expectedRef = WompiService.buildReference(order.getId(), order.getPublicToken());
                String ref = (data.has("reference") && !data.get("reference").isNull())
                        ? data.get("reference").asText("")
                        : "";
                if (!expectedRef.equals(ref)) {
                    System.out.println("Alerta de seguridad Wompi: La referencia " + ref + " no corresponde al pedido #" + orderId);
                    return "INVALID";
                }

                long expectedCents = Math.round((order.getTotal() != null ? order.getTotal() : 0.0) * 100);
                if (data.has("amount_in_cents") && !data.get("amount_in_cents").isNull()) {
                    long paidCents = data.get("amount_in_cents").asLong(-1L);
                    if (paidCents != expectedCents) {
                        System.out.println("Alerta de seguridad Wompi: Monto pagado (" + paidCents + ") difiere del pedido #" + orderId + " (" + expectedCents + ")");
                        return "INVALID";
                    }
                }

                String definitiveStatus = data.get("status").asText();

                if ("APPROVED".equals(definitiveStatus)) {
                    // Si la tienda ya configuró AMBOS secretos (integridad y eventos), el webhook firmado es la única
                    // fuente de verdad del pago: la página de retorno solo informa y no marca el pedido como pagado.
                    boolean webhookIsAuthoritative = wompiConfig.getIntegritySecret() != null
                            && !wompiConfig.getIntegritySecret().isBlank()
                            && wompiConfig.getExtraData() != null
                            && !wompiConfig.getExtraData().isBlank();
                    if (webhookIsAuthoritative) {
                        return "PENDING";
                    }
                    self.updateOrderStatus(
                            orderId,
                            OrderStatus.PAID,
                            EventOrigin.WEBHOOK,
                            null
                    );
                    return "APPROVED";
                } else if ("DECLINED".equals(definitiveStatus)
                        || "ERROR".equals(definitiveStatus)
                        || "VOIDED".equals(definitiveStatus)) {
                    self.recordPaymentAttemptFailure(orderId, wompiTransactionId, definitiveStatus);
                    return definitiveStatus;
                }

                return definitiveStatus;
            }

            return "PENDING";

        } catch (Exception e) {
            System.out.println("Error verificando transacción Wompi: " + e.getMessage());
            return "ERROR";
        } finally {
            TenantContext.setCurrentTenant(store.getSchemaName());
        }
    }
}