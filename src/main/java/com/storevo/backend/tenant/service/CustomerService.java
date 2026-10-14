package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CustomerDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.model.OrderStatus;
import com.storevo.backend.tenant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final OrderRepository orderRepository;

    /**
     * Método original conservado por retrocompatibilidad.
     */
    @Transactional(readOnly = true)
    public List<CustomerDto> getAllCustomers() {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        return aggregateCustomersFromOrders(orders);
    }

    /**
     * Búsqueda, filtrado y paginación para el directorio de clientes.
     */
    @Transactional(readOnly = true)
    public Page<CustomerDto> searchCustomers(String q, String type, OrderChannel channel, String sortStr, Pageable pageable) {
        List<CustomerDto> allCustomers = getAllCustomers();

        String query = (q == null) ? "" : q.trim().toLowerCase();

        List<CustomerDto> filtered = allCustomers.stream()
                .filter(c -> {
                    if (query.isEmpty()) return true;
                    return containsIgnoreCase(c.getName(), query)
                            || containsIgnoreCase(c.getPhone(), query)
                            || containsIgnoreCase(c.getCity(), query)
                            || containsIgnoreCase(c.getDocument(), query)
                            || containsIgnoreCase(c.getEmail(), query);
                })
                .filter(c -> {
                    if (type == null || type.isBlank()) return true;
                    long count = c.getTotalOrders() != null ? c.getTotalOrders() : 0L;
                    if ("recurrent".equalsIgnoreCase(type)) return count >= 2;
                    if ("single".equalsIgnoreCase(type)) return count == 1;
                    return true;
                })
                .filter(c -> {
                    if (channel == null) return true;
                    return c.getChannels() != null && c.getChannels().contains(channel);
                })
                .collect(Collectors.toList());

        Comparator<CustomerDto> comparator;
        switch (sortStr == null ? "" : sortStr) {
            case "spent_desc":
                comparator = Comparator.comparing((CustomerDto c) -> c.getTotalSpent() != null ? c.getTotalSpent() : 0.0).reversed();
                break;
            case "orders_desc":
                comparator = Comparator.comparing((CustomerDto c) -> c.getTotalOrders() != null ? c.getTotalOrders() : 0L).reversed();
                break;
            case "name_asc":
                comparator = Comparator.comparing((CustomerDto c) -> c.getName() != null ? c.getName().toLowerCase() : "");
                break;
            case "last_order_desc":
            default:
                comparator = Comparator.comparing(
                        CustomerDto::getLastOrderDate,
                        Comparator.nullsLast(Comparator.reverseOrder())
                );
                break;
        }

        filtered.sort(comparator);

        int start = (int) pageable.getOffset();
        if (start >= filtered.size()) {
            return new PageImpl<>(Collections.emptyList(), pageable, filtered.size());
        }
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        return new PageImpl<>(filtered.subList(start, end), pageable, filtered.size());
    }

    @Transactional(readOnly = true)
    public CustomerDto getCustomerByPhone(String phone) {
        if (phone == null || phone.isBlank()) return null;
        String targetKey = normalizePhoneKey(phone);
        return getAllCustomers().stream()
                .filter(c -> normalizePhoneKey(c.getPhone()).equals(targetKey))
                .findFirst()
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<Order> getOrdersByCustomerPhone(String phone) {
        if (phone == null || phone.isBlank()) return Collections.emptyList();
        String targetKey = normalizePhoneKey(phone);
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> normalizePhoneKey(o.getCustomerPhone()).equals(targetKey))
                .collect(Collectors.toList());
        orders.forEach(o -> o.getItems().size());
        return orders;
    }

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

        String targetKey = normalizePhoneKey(originalPhone);
        List<Order> customerOrders = orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> normalizePhoneKey(o.getCustomerPhone()).equals(targetKey))
                .collect(Collectors.toList());

        for (Order order : customerOrders) {
            if (name != null && !name.isBlank()) order.setCustomerName(name.trim());
            if (phone != null && !phone.isBlank()) order.setCustomerPhone(phone.trim());
            if (document != null) order.setCustomerDocument(document.trim());
            if (city != null && !city.isBlank()) order.setCity(city.trim());
            if (address != null && !address.isBlank()) order.setAddress(address.trim());
        }

        if (!customerOrders.isEmpty()) {
            orderRepository.saveAll(customerOrders);
        }
    }

    private List<CustomerDto> aggregateCustomersFromOrders(List<Order> orders) {
        Map<String, List<Order>> groupedByCustomer = new LinkedHashMap<>();

        for (Order order : orders) {
            String key = normalizePhoneKey(order.getCustomerPhone());
            if (key.isEmpty()) {
                key = "NAME_" + (order.getCustomerName() != null ? order.getCustomerName().trim().toLowerCase() : order.getId());
            }
            groupedByCustomer.computeIfAbsent(key, k -> new ArrayList<>()).add(order);
        }

        List<CustomerDto> result = new ArrayList<>();

        for (List<Order> customerOrders : groupedByCustomer.values()) {
            // La lista viene ordenada de más reciente a más antigua
            Order latest = customerOrders.get(0);

            long totalOrders = customerOrders.size();
            double totalSpent = customerOrders.stream()
                    .filter(o -> o.getStatus() != OrderStatus.CANCELLED && o.getStatus() != OrderStatus.REFUNDED)
                    .mapToDouble(o -> o.getTotal() != null ? o.getTotal() : 0.0)
                    .sum();

            LocalDateTime lastOrderDate = latest.getCreatedAt();
            OrderChannel lastChannel = latest.getChannel();

            // Punto 2: recolectar todos los canales que este cliente ha usado
            List<OrderChannel> channels = customerOrders.stream()
                    .map(Order::getChannel)
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());

            String document = customerOrders.stream()
                    .map(Order::getCustomerDocument)
                    .filter(d -> d != null && !d.isBlank())
                    .findFirst()
                    .orElse(null);

            String address = customerOrders.stream()
                    .map(Order::getAddress)
                    .filter(a -> a != null && !a.isBlank())
                    .findFirst()
                    .orElse(null);

            String city = customerOrders.stream()
                    .map(Order::getCity)
                    .filter(c -> c != null && !c.isBlank())
                    .findFirst()
                    .orElse(latest.getCity());

            result.add(CustomerDto.builder()
                    .name(latest.getCustomerName())
                    .phone(latest.getCustomerPhone())
                    .city(city)
                    .address(address)
                    .document(document)
                    .totalOrders(totalOrders)
                    .totalSpent(totalSpent)
                    .lastOrderDate(lastOrderDate)
                    .channels(channels)
                    .lastChannel(lastChannel)
                    .build());
        }

        return result;
    }

    private String normalizePhoneKey(String rawPhone) {
        if (rawPhone == null) return "";
        String digits = rawPhone.replaceAll("[^0-9]", "");
        if (digits.startsWith("57") && digits.length() == 12) {
            return digits.substring(2);
        }
        return digits;
    }

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query);
    }
}