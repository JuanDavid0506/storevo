package com.storevo.backend.tenant.service;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.tenant.dto.CustomerDto;
import com.storevo.backend.tenant.dto.StoreSettingsDto;
import com.storevo.backend.tenant.model.Customer;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.CustomerRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    static final String INVALID_CREDENTIALS_MESSAGE = "Credenciales incorrectas o cuenta no registrada en esta tienda.";

    private static final Set<OrderStatus> VALID_SPENT_STATUSES = EnumSet.of(
            OrderStatus.PAID,
            OrderStatus.CONFIRMED,
            OrderStatus.PREPARING,
            OrderStatus.PACKED,
            OrderStatus.SHIPPED,
            OrderStatus.DELIVERED
    );

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final CartManager cartManager;
    private final WishlistManager wishlistManager;
    private final EmailNotificationService emailNotificationService;

    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        return customerRepository.findAllByOrderByLastOrderDateDescIdDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CustomerDto> searchCustomers(String q, String type, OrderChannel channel, String sortStr, Pageable pageable) {
        String cleanQ = (q != null && !q.isBlank()) ? q.trim() : null;
        String cleanType = (type != null && ("recurrent".equalsIgnoreCase(type.trim()) || "single".equalsIgnoreCase(type.trim())))
                ? type.trim().toLowerCase(Locale.ROOT)
                : null;
        String channelStr = (channel != null) ? channel.name() : null;

        Sort sort = switch (sortStr == null ? "" : sortStr.trim()) {
            case "spent_desc" -> Sort.by(Sort.Order.desc("totalSpent"), Sort.Order.desc("lastOrderDate"), Sort.Order.desc("id"));
            case "orders_desc" -> Sort.by(Sort.Order.desc("totalOrders"), Sort.Order.desc("lastOrderDate"), Sort.Order.desc("id"));
            case "name_asc" -> Sort.by(Sort.Order.asc("name").ignoreCase(), Sort.Order.desc("id"));
            case "last_order_desc" -> Sort.by(Sort.Order.desc("lastOrderDate"), Sort.Order.desc("id"));
            default -> Sort.by(Sort.Order.desc("lastOrderDate"), Sort.Order.desc("id"));
        };

        Pageable sortedPageable = PageRequest.of(
                Math.max(0, pageable.getPageNumber()),
                Math.max(1, pageable.getPageSize()),
                sort
        );

        Page<Customer> page = customerRepository.searchCustomers(cleanQ, cleanType, channelStr, sortedPageable);
        return page.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerByPhone(String phone) {
        return findCustomerEntityByPhone(phone)
                .map(this::toDto)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomerPhone(String phone) {
        Optional<Customer> customerOpt = findCustomerEntityByPhone(phone);
        if (customerOpt.isEmpty()) {
            return Collections.emptyList();
        }
        Customer customer = customerOpt.get();
        List<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        if (orders.isEmpty() && customer.getPhone() != null) {
            orders = orderRepository.findByCustomerPhoneOrderByCreatedAtDesc(customer.getPhone());
        }
        orders.forEach(o -> o.getItems().size());
        return orders;
    }

    /**
     * Inmutabilidad histórica (Objetivo A7):
     * Actualiza únicamente el perfil del cliente en la tabla `customers`.
     * Los pedidos históricos en `orders` permanecen intactos como comprobantes inmutables de cada compra,
     * manteniendo su vínculo mediante `orders.customer_id`.
     */
    @Transactional
    public void updateCustomerData(
            String originalPhone,
            String name,
            String phone,
            String documentType,
            String document,
            String verificationDigit,
            String email,
            String city,
            String address,
            String legalName,
            String taxRegime) {

        Customer customer = findCustomerEntityByPhone(originalPhone)
                .orElseThrow(() -> new IllegalArgumentException("Cliente no encontrado."));

        if (name != null && !name.isBlank()) {
            customer.setName(name.trim());
        }
        if (phone != null && !phone.isBlank()) {
            String trimmedPhone = phone.trim();
            String newPhoneKey = buildPhoneKey(trimmedPhone, customer.getName());
            Optional<Customer> collision = customerRepository.findByPhoneKey(newPhoneKey);
            if (collision.isPresent() && !collision.get().getId().equals(customer.getId())) {
                throw new IllegalArgumentException("Ya existe otro cliente registrado con ese número de teléfono.");
            }
            customer.setPhone(trimmedPhone);
            customer.setPhoneKey(newPhoneKey);
        }
        if (documentType != null) {
            customer.setDocumentType(cleanNullable(documentType));
        }
        if (document != null) {
            customer.setDocument(cleanNullable(document));
        }
        if (verificationDigit != null) {
            customer.setVerificationDigit(cleanNullable(verificationDigit));
        }
        if (email != null) {
            customer.setEmail(cleanNullable(email));
        }
        if (city != null && !city.isBlank()) {
            customer.setCity(city.trim());
        }
        if (address != null && !address.isBlank()) {
            customer.setAddress(address.trim());
        }
        if (legalName != null) {
            customer.setLegalName(cleanNullable(legalName));
        }
        if (taxRegime != null) {
            customer.setTaxRegime(cleanNullable(taxRegime));
        }
        if ((customer.getLegalName() != null && !customer.getLegalName().isBlank())
                || "NIT".equalsIgnoreCase(customer.getDocumentType())) {
            customer.setRequiresElectronicInvoice(true);
        }

        customerRepository.save(customer);
    }

    /**
     * Crea o actualiza el registro en `customers` al registrar un nuevo pedido y lo vincula a `Order`.
     * Si el pedido ya trae un Customer autenticado asignado, lo respeta como titular del pedido.
     */
    @Transactional
    public Customer syncCustomerOnOrderCreated(Order order) {
        if (order == null) {
            return null;
        }
        String phoneKey = buildPhoneKey(order.getCustomerPhone(), order.getCustomerName());
        Customer customer = null;
        if (order.getCustomer() != null && order.getCustomer().getId() != null) {
            customer = customerRepository.findById(order.getCustomer().getId()).orElse(null);
        }
        if (customer == null) {
            customer = customerRepository.findByPhoneKey(phoneKey).orElse(null);
        }
        if (customer == null && order.getCustomerEmail() != null && !order.getCustomerEmail().isBlank()) {
            customer = customerRepository.findFirstByEmailIgnoreCaseOrderByHasAccountDescIdDesc(order.getCustomerEmail().trim()).orElse(null);
        }

        // Una cuenta registrada (o la cuenta autenticada que compra) NUNCA se modifica con los datos tecleados
        // en un pedido: evita que un invitado cambie el email/teléfono de una cuenta ajena (Account Takeover vía
        // recuperación de contraseña) y que el checkout autenticado altere la identidad de la cuenta.
        // Los datos de la cuenta solo cambian desde "Mi Cuenta" o con "Guardar estos datos" en el checkout.
        boolean protectedAccount = customer != null && Boolean.TRUE.equals(customer.getHasAccount());

        if (customer == null) {
            customer = Customer.builder()
                    .phoneKey(phoneKey)
                    .name(order.getCustomerName() != null ? order.getCustomerName().trim() : "Cliente")
                    .phone(order.getCustomerPhone() != null ? order.getCustomerPhone().trim() : "")
                    .totalOrders(0L)
                    .totalSpent(0.0)
                    .requiresElectronicInvoice(false)
                    .hasAccount(false)
                    .build();
        }

        if (!protectedAccount) {
            applyOrderContactDataToGuestProfile(customer, order);
        }

        long currentOrders = customer.getTotalOrders() != null ? customer.getTotalOrders() : 0L;
        double currentSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : 0.0;
        double orderTotal = (order.getTotal() != null && order.getStatus() != null && VALID_SPENT_STATUSES.contains(order.getStatus()))
                ? order.getTotal()
                : 0.0;

        customer.setTotalOrders(currentOrders + 1L);
        customer.setTotalSpent(currentSpent + orderTotal);
        customer.setLastOrderDate(order.getCreatedAt() != null ? order.getCreatedAt() : java.time.LocalDateTime.now());

        if (order.getChannel() != null) {
            customer.setLastChannel(order.getChannel());
            List<OrderChannel> used = customer.getParsedChannels();
            if (!used.contains(order.getChannel())) {
                used.add(order.getChannel());
            }
            customer.setChannelsCsv(used.stream().map(Enum::name).collect(Collectors.joining(",")));
        }

        return customerRepository.save(customer);
    }

    /**
     * Copia los datos de contacto/facturación del pedido al perfil CRM de un cliente invitado (sin cuenta).
     */
    private void applyOrderContactDataToGuestProfile(Customer customer, Order order) {
        if (order.getCustomerName() != null && !order.getCustomerName().isBlank()) {
            customer.setName(order.getCustomerName().trim());
        }
        if (order.getCustomerPhone() != null && !order.getCustomerPhone().isBlank()) {
            customer.setPhone(order.getCustomerPhone().trim());
        }
        if (order.getCity() != null && !order.getCity().isBlank()) {
            customer.setCity(order.getCity().trim());
        }
        if (order.getAddress() != null && !order.getAddress().isBlank()) {
            customer.setAddress(order.getAddress().trim());
        }
        if (order.getCustomerEmail() != null && !order.getCustomerEmail().isBlank()) {
            customer.setEmail(order.getCustomerEmail().trim());
        }
        if (order.getDocumentType() != null && !order.getDocumentType().isBlank()) {
            customer.setDocumentType(order.getDocumentType().trim());
        }
        if (order.getCustomerDocument() != null && !order.getCustomerDocument().isBlank()) {
            customer.setDocument(stripVerificationDigit(order.getCustomerDocument(), order.getVerificationDigit()));
        }
        if (order.getVerificationDigit() != null && !order.getVerificationDigit().isBlank()) {
            customer.setVerificationDigit(order.getVerificationDigit().trim());
        }
        if (order.getLegalName() != null && !order.getLegalName().isBlank()) {
            customer.setLegalName(order.getLegalName().trim());
        }
        if (order.getTaxRegime() != null && !order.getTaxRegime().isBlank()) {
            customer.setTaxRegime(order.getTaxRegime().trim());
        }
        if (Boolean.TRUE.equals(order.getRequiresElectronicInvoice())) {
            customer.setRequiresElectronicInvoice(true);
        }
    }

    /**
     * El pedido guarda el documento como "numero-DV"; el perfil lo guarda sin DV (el DV va en su propio campo),
     * igual que lo hace "Mi Cuenta", para no duplicar el dígito al autocompletar el checkout.
     */
    static String stripVerificationDigit(String document, String verificationDigit) {
        if (document == null) {
            return null;
        }
        String cleanDoc = document.trim();
        if (verificationDigit != null && !verificationDigit.isBlank()) {
            String suffix = "-" + verificationDigit.trim();
            if (cleanDoc.endsWith(suffix) && cleanDoc.length() > suffix.length()) {
                return cleanDoc.substring(0, cleanDoc.length() - suffix.length());
            }
        }
        return cleanDoc;
    }

    /**
     * Recalcula los totales del cliente cuando un pedido cambia de estado (ej. al pagarse, confirmarse, cancelarse o reembolsarse).
     */
    @Transactional
    public void recalculateCustomerMetrics(Customer customer) {
        if (customer == null || customer.getId() == null) {
            return;
        }
        List<Order> customerOrders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        long totalOrders = customerOrders.size();
        double totalSpent = customerOrders.stream()
                .filter(o -> o.getStatus() != null && VALID_SPENT_STATUSES.contains(o.getStatus()))
                .mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0)
                .sum();

        customer.setTotalOrders(totalOrders);
        customer.setTotalSpent(totalSpent);

        if (!customerOrders.isEmpty()) {
            Order latest = customerOrders.get(0);
            customer.setLastOrderDate(latest.getCreatedAt());
            customer.setLastChannel(latest.getChannel());
            String csv = customerOrders.stream()
                    .map(Order::getChannel)
                    .filter(Objects::nonNull)
                    .distinct()
                    .map(Enum::name)
                    .collect(Collectors.joining(","));
            customer.setChannelsCsv(csv);
        }

        customerRepository.save(customer);
    }

    private Optional<Customer> findCustomerEntityByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return Optional.empty();
        }
        String key = normalizePhoneKey(phone);
        if (!key.isEmpty()) {
            Optional<Customer> byKey = customerRepository.findByPhoneKey(key);
            if (byKey.isPresent()) {
                return byKey;
            }
        }
        return customerRepository.findFirstByPhoneOrderByIdDesc(phone.trim());
    }

    private CustomerDto toDto(Customer c) {
        return CustomerDto.builder()
                .name(c.getName())
                .phone(c.getPhone())
                .email(c.getEmail())
                .city(c.getCity())
                .address(c.getAddress())
                .documentType(c.getDocumentType())
                .document(c.getDocument())
                .verificationDigit(c.getVerificationDigit())
                .legalName(c.getLegalName())
                .taxRegime(c.getTaxRegime())
                .requiresElectronicInvoice(Boolean.TRUE.equals(c.getRequiresElectronicInvoice()))
                .totalOrders(c.getTotalOrders() != null ? c.getTotalOrders() : 0L)
                .totalSpent(c.getTotalSpent() != null ? c.getTotalSpent() : 0.0)
                .lastOrderDate(c.getLastOrderDate())
                .channels(c.getParsedChannels())
                .lastChannel(c.getLastChannel())
                .build();
    }

    public static String buildPhoneKey(String rawPhone, String fallbackName) {
        String key = normalizePhoneKey(rawPhone);
        if (!key.isEmpty()) {
            return key;
        }
        String cleanName = (fallbackName != null && !fallbackName.isBlank())
                ? fallbackName.trim().toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "_")
                : UUID.randomUUID().toString().substring(0, 8);
        return "NAME_" + (cleanName.length() > 30 ? cleanName.substring(0, 30) : cleanName);
    }

    public static String normalizePhoneKey(String rawPhone) {
        if (rawPhone == null) return "";
        String digits = rawPhone.replaceAll("[^0-9]", "");
        if (digits.startsWith("57") && digits.length() == 12) {
            return digits.substring(2);
        }
        return digits.length() > 35 ? digits.substring(digits.length() - 35) : digits;
    }

    private String cleanNullable(String value) {
        return (value != null && !value.isBlank()) ? value.trim() : null;
    }

    // =========================================================================
    // CUENTAS DE COMPRADORES EN LA TIENDA PÚBLICA (/s/{slug}/account)
    // =========================================================================

    @Transactional(readOnly = true)
    public Customer getCustomerEntityById(Long customerId) {
        if (customerId == null) {
            return null;
        }
        return customerRepository.findById(customerId).orElse(null);
    }

    @Transactional(readOnly = true)
    public long countPendingOrdersByCustomerId(Long customerId) {
        if (customerId == null) {
            return 0L;
        }
        return orderRepository.countByCustomerIdAndStatusAndPlacedWithAccountTrue(customerId, OrderStatus.PENDING);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersForAuthenticatedCustomer(Long customerId) {
        if (customerId == null) {
            return Collections.emptyList();
        }
        // Solo pedidos creados con la sesión autenticada: los pedidos de invitado vinculados por teléfono/email
        // en el CRM del comerciante nunca se exponen en el portal del comprador.
        List<Order> orders = orderRepository.findByCustomerIdAndPlacedWithAccountTrueOrderByCreatedAtDesc(customerId);
        for (Order o : orders) {
            o.getItems().size();
            o.getShipments().size();
            o.getShipments().forEach(s -> {
                if (s.getCarrier() != null) {
                    s.getCarrier().getName();
                    s.getCarrier().getTrackingUrlTemplate();
                }
            });
        }
        return orders;
    }

    /**
     * Registra una cuenta de comprador en la tienda actual o promueve un perfil previo de invitado.
     * Al promover un perfil de invitado se descartan sus datos sensibles previos (dirección, documento,
     * razón social...) y NO se reclaman pedidos históricos: el portal solo muestra pedidos hechos con la cuenta.
     */
    @Transactional
    public Customer registerCustomerAccount(
            String rawName,
            String rawEmail,
            String rawPhone,
            String rawPassword,
            String guestSessionId) {

        String cleanName = rawName != null ? rawName.trim() : "";
        if (cleanName.length() < 2) {
            throw new IllegalArgumentException("Por favor ingresa tu nombre completo.");
        }
        String cleanEmail = rawEmail != null ? rawEmail.trim().toLowerCase(Locale.ROOT) : "";
        if (cleanEmail.isEmpty() || !cleanEmail.contains("@")) {
            throw new IllegalArgumentException("Por favor ingresa un correo electrónico válido.");
        }
        String cleanPhone = rawPhone != null ? rawPhone.trim() : "";
        String phoneKey = normalizePhoneKey(cleanPhone);
        if (phoneKey.length() < 7) {
            throw new IllegalArgumentException("Por favor ingresa un número de teléfono / WhatsApp válido.");
        }
        if (rawPassword == null || rawPassword.trim().length() < 8) {
            throw new IllegalArgumentException("La contraseña debe tener al menos 8 caracteres.");
        }

        // 1. Verificar si ya existe una cuenta registrada con ese correo o teléfono
        Optional<Customer> registeredByEmail = customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue(cleanEmail);
        if (registeredByEmail.isPresent()) {
            throw new IllegalArgumentException("Ya existe una cuenta registrada con este correo electrónico. Inicia sesión.");
        }

        Optional<Customer> existingByPhoneKey = customerRepository.findByPhoneKey(phoneKey);
        if (existingByPhoneKey.isPresent() && Boolean.TRUE.equals(existingByPhoneKey.get().getHasAccount())) {
            throw new IllegalArgumentException("Ya existe una cuenta registrada con este número de teléfono. Inicia sesión.");
        }

        // 2. Reutilizar perfil de invitado previo (por teléfono o por correo) o crear uno nuevo
        Customer customer = existingByPhoneKey.orElse(null);
        if (customer == null) {
            Optional<Customer> guestByEmail = customerRepository.findFirstByEmailIgnoreCaseOrderByHasAccountDescIdDesc(cleanEmail);
            if (guestByEmail.isPresent() && !Boolean.TRUE.equals(guestByEmail.get().getHasAccount())) {
                customer = guestByEmail.get();
                customer.setPhoneKey(phoneKey);
            }
        }

        if (customer == null) {
            customer = Customer.builder()
                    .phoneKey(phoneKey)
                    .name(cleanName)
                    .phone(cleanPhone)
                    .email(cleanEmail)
                    .totalOrders(0L)
                    .totalSpent(0.0)
                    .requiresElectronicInvoice(false)
                    .build();
        } else {
            customer.setName(cleanName);
            customer.setPhone(cleanPhone);
            customer.setEmail(cleanEmail);
            clearSensitiveGuestData(customer);
        }

        LocalDateTime now = LocalDateTime.now();
        customer.setPasswordHash(passwordEncoder.encode(rawPassword));
        customer.setHasAccount(true);
        customer.setLastLoginAt(now);
        customer.setPasswordChangedAt(now);
        customer.setResetPasswordToken(null);
        customer.setResetPasswordExpiresAt(null);

        customer = customerRepository.save(customer);

        // 3. Fusionar bolsa y lista de deseos de invitado hacia la cuenta
        cartManager.mergeGuestCartIntoCustomerCart(guestSessionId, customer.getId());
        wishlistManager.mergeGuestWishlistIntoCustomerWishlist(guestSessionId, customer.getId());

        return customer;
    }

    /**
     * Autentica al comprador usando su correo electrónico o su número de teléfono/WhatsApp.
     */
    @Transactional
    public Customer authenticateCustomer(String identifier, String rawPassword, String guestSessionId) {
        if (identifier == null || identifier.isBlank() || rawPassword == null || rawPassword.isBlank()) {
            throw new IllegalArgumentException("Ingresa tu correo o teléfono y tu contraseña.");
        }
        String trimmed = identifier.trim();
        Optional<Customer> candidateOpt;

        if (trimmed.contains("@")) {
            candidateOpt = customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue(trimmed.toLowerCase(Locale.ROOT));
        } else {
            String phoneKey = normalizePhoneKey(trimmed);
            candidateOpt = !phoneKey.isEmpty()
                    ? customerRepository.findByPhoneKey(phoneKey)
                    : Optional.empty();
        }

        // Mensaje único para no revelar si la cuenta existe (enumeración de usuarios)
        Customer candidate = candidateOpt
                .filter(c -> Boolean.TRUE.equals(c.getHasAccount()) && c.getPasswordHash() != null)
                .orElseThrow(() -> new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE));

        if (!passwordEncoder.matches(rawPassword, candidate.getPasswordHash())) {
            throw new IllegalArgumentException(INVALID_CREDENTIALS_MESSAGE);
        }

        Customer customer = candidate;
        customer.setLastLoginAt(LocalDateTime.now());
        customer = customerRepository.save(customer);

        // Fusionar bolsa y favoritos de la sesión anónima actual
        cartManager.mergeGuestCartIntoCustomerCart(guestSessionId, customer.getId());
        wishlistManager.mergeGuestWishlistIntoCustomerWishlist(guestSessionId, customer.getId());

        return customer;
    }

    /**
     * Actualiza los datos de envío y facturación predeterminados del comprador desde "Mi Cuenta" o desde el Checkout.
     */
    @Transactional
    public Customer updateAuthenticatedCustomerProfile(
            Long customerId,
            String name,
            String phone,
            String email,
            String city,
            String address,
            String documentType,
            String document,
            String verificationDigit,
            String legalName,
            String taxRegime,
            Boolean requiresElectronicInvoice) {

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta de cliente no encontrada."));

        if (name != null && !name.isBlank()) {
            customer.setName(name.trim());
        }
        if (phone != null && !phone.isBlank()) {
            String cleanPhone = phone.trim();
            String newKey = buildPhoneKey(cleanPhone, customer.getName());
            Optional<Customer> collision = customerRepository.findByPhoneKey(newKey);
            if (collision.isPresent() && !collision.get().getId().equals(customer.getId())) {
                throw new IllegalArgumentException("Ese número de teléfono ya está asociado a otro cliente en esta tienda.");
            }
            customer.setPhone(cleanPhone);
            customer.setPhoneKey(newKey);
        }
        if (email != null && !email.isBlank()) {
            String cleanEmail = email.trim().toLowerCase(Locale.ROOT);
            Optional<Customer> emailCollision = customerRepository.findFirstByEmailIgnoreCaseAndHasAccountTrue(cleanEmail);
            if (emailCollision.isPresent() && !emailCollision.get().getId().equals(customer.getId())) {
                throw new IllegalArgumentException("Ese correo electrónico ya está en uso por otra cuenta.");
            }
            customer.setEmail(cleanEmail);
        }
        if (city != null) {
            customer.setCity(cleanNullable(city));
        }
        if (address != null) {
            customer.setAddress(cleanNullable(address));
        }
        if (documentType != null) {
            customer.setDocumentType(cleanNullable(documentType));
        }
        if (document != null) {
            customer.setDocument(cleanNullable(document));
        }
        if (verificationDigit != null) {
            customer.setVerificationDigit(cleanNullable(verificationDigit));
        }
        if (legalName != null) {
            customer.setLegalName(cleanNullable(legalName));
        }
        if (taxRegime != null) {
            customer.setTaxRegime(cleanNullable(taxRegime));
        }
        if (requiresElectronicInvoice != null) {
            customer.setRequiresElectronicInvoice(requiresElectronicInvoice);
        }

        return customerRepository.save(customer);
    }

    @Transactional
    public void changeCustomerPassword(Long customerId, String currentPassword, String newPassword) {
        if (newPassword == null || newPassword.trim().length() < 8) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 8 caracteres.");
        }
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new IllegalArgumentException("Cuenta no encontrada."));

        if (customer.getPasswordHash() == null || currentPassword == null
                || !passwordEncoder.matches(currentPassword, customer.getPasswordHash())) {
            throw new IllegalArgumentException("La contraseña actual no es correcta.");
        }

        customer.setPasswordHash(passwordEncoder.encode(newPassword));
        customer.setPasswordChangedAt(LocalDateTime.now());
        customerRepository.save(customer);
    }

    @Transactional
    public void requestCustomerPasswordReset(
            String rawEmailOrPhone,
            Store store,
            StoreSettingsDto settings,
            String baseUrl) {
        if (rawEmailOrPhone == null || rawEmailOrPhone.isBlank() || store == null) {
            return;
        }
        String trimmed = rawEmailOrPhone.trim();
        Optional<Customer> customerOpt;
        if (trimmed.contains("@")) {
            customerOpt = customerRepository.findFirstByEmailIgnoreCaseOrderByHasAccountDescIdDesc(trimmed.toLowerCase(Locale.ROOT));
        } else {
            String phoneKey = normalizePhoneKey(trimmed);
            customerOpt = !phoneKey.isEmpty() ? customerRepository.findByPhoneKey(phoneKey) : Optional.empty();
        }

        customerOpt.filter(c -> c.getEmail() != null && !c.getEmail().isBlank()).ifPresent(customer -> {
            String token = UUID.randomUUID().toString();
            // En BD solo se guarda el hash SHA-256: una fuga de la tabla no permite usar enlaces vigentes
            customer.setResetPasswordToken(hashResetToken(token));
            customer.setResetPasswordExpiresAt(LocalDateTime.now().plusMinutes(30));
            customerRepository.save(customer);

            String cleanBase = (baseUrl != null && !baseUrl.isBlank())
                    ? (baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl.trim())
                    : "http://localhost:8080";
            String resetLink = cleanBase + "/s/" + store.getSlug() + "/account/reset-password?token=" + token;
            final String toEmail = customer.getEmail();
            final String toName = customer.getName();
            runAfterCommit(() -> emailNotificationService.sendStoreCustomerPasswordResetEmail(
                    store, settings, toEmail, toName, resetLink));
        });
    }

    @Transactional(readOnly = true)
    public boolean isCustomerResetTokenValid(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        return customerRepository.findByResetPasswordToken(hashResetToken(token.trim()))
                .filter(c -> c.getResetPasswordExpiresAt() != null
                        && c.getResetPasswordExpiresAt().isAfter(LocalDateTime.now()))
                .isPresent();
    }

    static String hashResetToken(String rawToken) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 no disponible", e);
        }
    }

    private void runAfterCommit(Runnable task) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            task.run();
                        }
                    });
        } else {
            task.run();
        }
    }

    /**
     * Descarta los datos sensibles heredados de un perfil de invitado cuando se convierte en cuenta,
     * para que quien activa la cuenta no vea direcciones/documentos tecleados previamente por otra persona.
     */
    private void clearSensitiveGuestData(Customer customer) {
        customer.setAddress(null);
        customer.setCity(null);
        customer.setDocumentType(null);
        customer.setDocument(null);
        customer.setVerificationDigit(null);
        customer.setLegalName(null);
        customer.setTaxRegime(null);
        customer.setRequiresElectronicInvoice(false);
    }

    @Transactional
    public void resetCustomerPasswordWithToken(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("El enlace de recuperación no es válido o ha expirado.");
        }
        if (newPassword == null || newPassword.trim().length() < 8) {
            throw new IllegalArgumentException("La nueva contraseña debe tener al menos 8 caracteres.");
        }
        Customer customer = customerRepository.findByResetPasswordToken(hashResetToken(token.trim()))
                .orElseThrow(() -> new IllegalArgumentException("El enlace de recuperación no es válido o ya fue utilizado."));

        if (customer.getResetPasswordExpiresAt() == null
                || !customer.getResetPasswordExpiresAt().isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("El enlace de recuperación ha expirado. Solicita uno nuevo.");
        }

        // Si el enlace activa por primera vez un perfil de invitado, se aplica la misma limpieza que en el registro
        if (!Boolean.TRUE.equals(customer.getHasAccount())) {
            clearSensitiveGuestData(customer);
        }
        customer.setPasswordHash(passwordEncoder.encode(newPassword));
        customer.setPasswordChangedAt(LocalDateTime.now());
        customer.setHasAccount(true);
        customer.setResetPasswordToken(null);
        customer.setResetPasswordExpiresAt(null);
        customerRepository.save(customer);
    }
}