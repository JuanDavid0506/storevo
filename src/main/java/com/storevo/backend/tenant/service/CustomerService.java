package com.storevo.backend.tenant.service;

import com.storevo.backend.tenant.dto.CustomerDto;
import com.storevo.backend.tenant.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerService {

    private final OrderRepository orderRepository;

    public List<CustomerDto> getAllCustomers() {
        List<Object[]> results = orderRepository.findCustomerAggregates();

        return results.stream().map(row -> CustomerDto.builder()
                .name((String) row[0])
                .phone((String) row[1])
                .city((String) row[2])
                .totalOrders(((Number) row[3]).longValue())
                .totalSpent(((Number) row[4]).doubleValue())
                .lastOrderDate((LocalDateTime) row[5])
                .build()
        ).collect(Collectors.toList());
    }
}