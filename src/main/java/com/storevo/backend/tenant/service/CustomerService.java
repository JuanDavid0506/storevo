package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CustomerDto;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

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
     */
    @Transactional
    public Customer syncCustomerOnOrderCreated(Order order) {
        if (order == null) {
            return null;
        }
        String phoneKey = buildPhoneKey(order.getCustomerPhone(), order.getCustomerName());
        Customer customer = customerRepository.findByPhoneKey(phoneKey)
                .orElseGet(() -> Customer.builder()
                        .phoneKey(phoneKey)
                        .name(order.getCustomerName() != null ? order.getCustomerName().trim() : "Cliente")
                        .phone(order.getCustomerPhone() != null ? order.getCustomerPhone().trim() : "")
                        .totalOrders(0L)
                        .totalSpent(0.0)
                        .requiresElectronicInvoice(false)
                        .build());

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
            customer.setDocument(order.getCustomerDocument().trim());
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

        long currentOrders = customer.getTotalOrders() != null ? customer.getTotalOrders() : 0L;
        double currentSpent = customer.getTotalSpent() != null ? customer.getTotalSpent() : 0.0;
        double orderTotal = (order.getTotal() != null && order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.REFUNDED)
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
     * Recalcula los totales del cliente cuando un pedido cambia de estado (ej. al cancelarse o reembolsarse).
     */
    @Transactional
    public void recalculateCustomerMetrics(Customer customer) {
        if (customer == null || customer.getId() == null) {
            return;
        }
        List<Order> customerOrders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(customer.getId());
        long totalOrders = customerOrders.size();
        double totalSpent = customerOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.REFUNDED)
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
}