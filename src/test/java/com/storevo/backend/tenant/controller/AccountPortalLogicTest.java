package com.storevo.backend.tenant.controller;

import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderStatus;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AccountPortalLogicTest {

    private static Order order(OrderStatus status) {
        return Order.builder().status(status).build();
    }

    @Test
    void tabResolution_acceptsNewTabsAndLegacyProfileAlias() {
        assertEquals("orders", StoreCustomerAuthController.resolveAccountTab(null));
        assertEquals("orders", StoreCustomerAuthController.resolveAccountTab("orders"));
        assertEquals("shipping", StoreCustomerAuthController.resolveAccountTab("shipping"));
        assertEquals("billing", StoreCustomerAuthController.resolveAccountTab(" BILLING "));
        assertEquals("security", StoreCustomerAuthController.resolveAccountTab("security"));
        assertEquals("shipping", StoreCustomerAuthController.resolveAccountTab("profile"));
        assertEquals("orders", StoreCustomerAuthController.resolveAccountTab("<script>"));
    }

    @Test
    void stats_areComputedOnlyFromTheOrdersPassedIn() {
        List<Order> shown = new ArrayList<>(List.of(
                order(OrderStatus.PENDING), order(OrderStatus.PAID), order(OrderStatus.SHIPPED),
                order(OrderStatus.DELIVERED), order(OrderStatus.DELIVERED),
                order(OrderStatus.CANCELLED), order(OrderStatus.REFUNDED)));
        shown.add(null);
        shown.add(order(null));

        Map<String, Long> stats = StoreCustomerAuthController.buildOrderStats(shown);

        assertEquals(8L, stats.get("total"));       // los nulos de lista no cuentan
        assertEquals(4L, stats.get("inProgress"));  // PENDING, PAID, SHIPPED y el de estado desconocido
        assertEquals(2L, stats.get("delivered"));
    }

    @Test
    void stats_handleNullAndEmptyLists() {
        assertEquals(0L, StoreCustomerAuthController.buildOrderStats(null).get("total"));
        assertEquals(0L, StoreCustomerAuthController.buildOrderStats(List.of()).get("inProgress"));
    }
}
