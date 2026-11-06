package com.storevo.backend;

import com.storevo.backend.admin.repository.StoreIntegrationRepository;
import com.storevo.backend.tenant.controller.CartController;
import com.storevo.backend.tenant.dto.CartItemDto;
import com.storevo.backend.tenant.model.*;
import com.storevo.backend.tenant.repository.CartItemRepository;
import com.storevo.backend.tenant.repository.OrderRepository;
import com.storevo.backend.tenant.repository.ProductRepository;
import com.storevo.backend.tenant.repository.ProductVariantRepository;
import com.storevo.backend.tenant.service.CartManager;
import com.storevo.backend.tenant.service.InventoryService;
import com.storevo.backend.tenant.service.OrderService;
import com.storevo.backend.tenant.service.ProductService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class C2CartAndOrderIntegrityTest {

    @Mock private CartItemRepository cartItemRepository;
    @Mock private ProductRepository productRepository;
    @Mock private ProductVariantRepository variantRepository;
    @Mock private OrderRepository orderRepository;
    @Mock private StoreIntegrationRepository integrationRepository;
    @Mock private ProductService productService;
    @Mock private HttpServletRequest request;
    @Mock private com.storevo.backend.tenant.service.CustomerService customerService;
    @Mock private com.storevo.backend.tenant.service.CouponService couponService;
    @Mock private com.storevo.backend.tenant.service.EmailNotificationService emailNotificationService;
    @Mock private com.storevo.backend.config.security.RateLimitService rateLimitService;
    @Mock private com.storevo.backend.admin.repository.StoreRepository storeRepository;
    @Mock private com.storevo.backend.admin.repository.UserRepository userRepository;
    @Mock private com.storevo.backend.admin.service.StoreSettingsService storeSettingsService;
    @Mock private org.springframework.transaction.PlatformTransactionManager transactionManager;

    private CartManager cartManager;
    private InventoryService inventoryService;
    private OrderService orderService;
    private CartController cartController;

    private static final String SESSION_ID = "guest-session-123";

    @BeforeEach
    void setUp() {
        cartManager = new CartManager(cartItemRepository, productRepository, variantRepository);
        inventoryService = new InventoryService(productRepository, variantRepository);
        orderService = new OrderService(
                orderRepository, productRepository, variantRepository,
                cartManager, inventoryService, customerService, integrationRepository,
                storeRepository, userRepository, storeSettingsService, transactionManager,
                emailNotificationService, couponService
        );
        cartController = new CartController(
                cartManager, productService, orderService, customerService, couponService,
                rateLimitService, variantRepository, integrationRepository
        );
        lenient().when(request.getAttribute("guestId")).thenReturn(SESSION_ID);
        lenient().when(productService.isProductPubliclyVisible(any())).thenReturn(true);
    }

    @Test
    void test1_addNormalProductWithValidPrice_succeeds() {
        Product product = Product.builder()
                .id(10L).name("Camiseta Clásica").price(45000.0)
                .stock(10).hasVariants(false).isActive(true).isDeleted(false).isDraft(false)
                .build();

        when(productService.getProductById(10L)).thenReturn(product);
        when(productRepository.findById(10L)).thenReturn(Optional.of(product));

        ResponseEntity< Map<String, Object> > res = cartController.addToCartAjax("mi-tienda", 10L, null, 2, request);
        assertEquals(Boolean.TRUE, res.getBody().get("success"));
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    void test2_addProductWithValidVariant_succeeds() {
        Product product = Product.builder()
                .id(20L).name("Tenis Running").price(120000.0)
                .stock(5).hasVariants(true).isActive(true).isDeleted(false).isDraft(false)
                .build();
        ProductVariant variant = ProductVariant.builder()
                .id(201L).product(product).price(135000.0).stock(5).isActive(true)
                .build();

        when(productService.getProductById(20L)).thenReturn(product);
        when(productRepository.findById(20L)).thenReturn(Optional.of(product));
        when(variantRepository.findByIdAndProductId(201L, 20L)).thenReturn(Optional.of(variant));

        ResponseEntity< Map<String, Object> > res = cartController.addToCartAjax("mi-tienda", 20L, 201L, 1, request);
        assertEquals(Boolean.TRUE, res.getBody().get("success"));
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    void test3_addForeignVariantFromAnotherProduct_rejected() {
        Product productA = Product.builder()
                .id(20L).name("Chaqueta Cuero").price(250000.0)
                .stock(5).hasVariants(true).isActive(true).isDeleted(false).isDraft(false)
                .build();

        when(productService.getProductById(20L)).thenReturn(productA);
        when(variantRepository.findByIdAndProductId(999L, 20L)).thenReturn(Optional.empty());

        ResponseEntity< Map<String, Object> > res = cartController.addToCartAjax("mi-tienda", 20L, 999L, 1, request);
        assertEquals(Boolean.FALSE, res.getBody().get("success"));
        assertEquals("La variante seleccionada no pertenece a este producto.", res.getBody().get("message"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void test4_addNormalProductWithZeroPrice_rejected() {
        Product zeroProduct = Product.builder()
                .id(30L).name("Producto Precio Cero").price(0.0)
                .stock(10).hasVariants(false).isActive(true).isDeleted(false).isDraft(false)
                .build();

        when(productService.getProductById(30L)).thenReturn(zeroProduct);

        ResponseEntity< Map<String, Object> > res = cartController.addToCartAjax("mi-tienda", 30L, null, 1, request);
        assertEquals(Boolean.FALSE, res.getBody().get("success"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void test5_addVariantWithZeroPrice_fallsBackToParentPrice() {
        // Regla vigente (CartManager.resolveEffectivePrice): variante con precio <= 0 usa el precio del producto padre
        Product product = Product.builder()
                .id(40L).name("Perfume").price(90000.0)
                .stock(10).hasVariants(true).isActive(true).isDeleted(false).isDraft(false)
                .build();
        ProductVariant zeroVariant = ProductVariant.builder()
                .id(401L).product(product).price(0.0).stock(10).isActive(true)
                .build();

        when(productService.getProductById(40L)).thenReturn(product);
        when(productRepository.findById(40L)).thenReturn(Optional.of(product));
        when(variantRepository.findByIdAndProductId(401L, 40L)).thenReturn(Optional.of(zeroVariant));

        assertEquals(90000.0, cartManager.resolveEffectivePrice(product, zeroVariant));
        ResponseEntity< Map<String, Object> > res = cartController.addToCartAjax("mi-tienda", 40L, 401L, 1, request);
        assertEquals(Boolean.TRUE, res.getBody().get("success"));
        verify(cartItemRepository).save(any(CartItem.class));
    }

    @Test
    void test5b_addProductWithoutAnyValidPrice_rejected() {
        Product product = Product.builder()
                .id(41L).name("Sin precio").price(0.0)
                .stock(10).hasVariants(true).isActive(true).isDeleted(false).isDraft(false)
                .build();
        ProductVariant zeroVariant = ProductVariant.builder()
                .id(411L).product(product).price(0.0).stock(10).isActive(true)
                .build();

        when(productService.getProductById(41L)).thenReturn(product);
        when(variantRepository.findByIdAndProductId(411L, 41L)).thenReturn(Optional.of(zeroVariant));

        ResponseEntity< Map<String, Object> > res = cartController.addToCartAjax("mi-tienda", 41L, 411L, 1, request);
        assertEquals(Boolean.FALSE, res.getBody().get("success"));
        assertEquals("Este producto no tiene un precio válido disponible.", res.getBody().get("message"));
        verify(cartItemRepository, never()).save(any());
    }

    @Test
    void test6_And_9_manipulatedPriceIsIgnoredAndServerPriceIsPreservedInCartAndOrder() {
        Product product = Product.builder()
                .id(50L).name("Reloj").price(180000.0).discountPrice(150000.0)
                .stock(10).hasVariants(false).isActive(true).isDeleted(false).isDraft(false)
                .build();

        when(productRepository.findById(50L)).thenReturn(Optional.of(product));

        CartItemDto manipulatedDto = CartItemDto.builder()
                .productId(50L).variantId(null).price(1.0).quantity(2).build();
        cartManager.addItem(SESSION_ID, manipulatedDto);

        CartItem savedCartEntity = CartItem.builder()
                .sessionId(SESSION_ID).product(product).variant(null).quantity(2).build();
        when(cartItemRepository.findBySessionId(SESSION_ID)).thenReturn(List.of(savedCartEntity));
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0, Order.class));

        List<CartItemDto> loadedCart = cartManager.getCart(SESSION_ID);
        assertEquals(150000.0, loadedCart.get(0).getPrice());
        assertEquals(300000.0, cartManager.getTotal(SESSION_ID));

        Order createdOrder = orderService.createOrderFromCart(
                SESSION_ID, "Juan Perez", "3001234567", "1098765432", "Calle 1", "Bogotá", null, OrderChannel.ONLINE
        );

        assertEquals(300000.0, createdOrder.getTotal());
        assertEquals(150000.0, createdOrder.getItems().get(0).getPrice());
        assertEquals(300000.0, createdOrder.getItems().get(0).getSubtotal());
    }

    @Test
    void test10_buyerWithAnUnverifiedAccountCanCheckoutAndTheOrderStaysInTheirAccount() {
        // D3 (verificación de correo): la barrera aplica SOLO al portal; el checkout con una cuenta sin verificar fluye normal
        Product product = Product.builder()
                .id(90L).name("Taza").price(20000.0)
                .stock(5).hasVariants(false).isActive(true).isDeleted(false).isDraft(false)
                .build();
        CartItem inCart = CartItem.builder().sessionId("cust:7").product(product).variant(null).quantity(2).build();
        Customer unverified = Customer.builder()
                .id(7L).name("Ana").phone("3001234567").email("ana@mail.com").hasAccount(true) // emailVerifiedAt == null
                .build();

        when(cartItemRepository.findBySessionId("cust:7")).thenReturn(List.of(inCart));
        when(productRepository.findById(90L)).thenReturn(Optional.of(product));
        when(customerService.getCustomerEntityById(7L)).thenReturn(unverified);
        when(customerService.syncCustomerOnOrderCreated(any(Order.class))).thenAnswer(inv -> inv.getArgument(0, Order.class).getCustomer());
        when(orderRepository.save(any(Order.class))).thenAnswer(inv -> inv.getArgument(0, Order.class));

        Order order = orderService.createOrderFromCart(
                "cust:7", "Ana", "3001234567", "ana@mail.com", null, null, null, null, null, false,
                "Calle 1 # 2-3", "Bogotá", "SHIPPING", null, OrderChannel.ONLINE, false, null, 7L);

        assertNull(unverified.getEmailVerifiedAt());
        assertSame(unverified, order.getCustomer());
        assertTrue(order.getPlacedWithAccount(), "queda en su cuenta y aparecerá en Mi Cuenta cuando verifique");
        assertEquals(OrderStatus.PENDING, order.getStatus());
        assertEquals(40000.0, order.getSubtotal());
    }

    @Test
    void test7_createOrderWithForeignVariant_throwsException() {
        Product productA = Product.builder()
                .id(60L).name("Bolso").price(200000.0)
                .stock(5).hasVariants(true).isActive(true).isDeleted(false).isDraft(false)
                .build();
        Product productB = Product.builder()
                .id(70L).name("Billetera").price(50000.0)
                .stock(5).hasVariants(true).isActive(true).isDeleted(false).isDraft(false)
                .build();
        ProductVariant variantOfB = ProductVariant.builder()
                .id(701L).product(productB).price(50000.0).stock(5).isActive(true)
                .build();

        CartItem corruptedCartItem = CartItem.builder()
                .sessionId(SESSION_ID).product(productA).variant(variantOfB).quantity(1).build();

        when(cartItemRepository.findBySessionId(SESSION_ID)).thenReturn(List.of(corruptedCartItem));
        when(productRepository.findById(60L)).thenReturn(Optional.of(productA));
        when(variantRepository.findByIdAndProductId(701L, 60L)).thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                orderService.createOrderFromCart(
                        SESSION_ID, "Juan Perez", "3001234567", "1098765432", "Calle 1", "Bogotá", null, OrderChannel.ONLINE
                )
        );
        assertTrue(ex.getMessage().contains("no pertenece al producto"));
        verify(orderRepository, never()).save(any());
    }

    @Test
    void test8_createOrderWithInvalidZeroPrice_throwsException() {
        Product productWithZeroPrice = Product.builder()
                .id(80L).name("Gorra").price(0.0)
                .stock(5).hasVariants(false).isActive(true).isDeleted(false).isDraft(false)
                .build();

        CartItem cartItem = CartItem.builder()
                .sessionId(SESSION_ID).product(productWithZeroPrice).variant(null).quantity(1).build();

        when(cartItemRepository.findBySessionId(SESSION_ID)).thenReturn(List.of(cartItem));
        when(productRepository.findById(80L)).thenReturn(Optional.of(productWithZeroPrice));

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                orderService.createOrderFromCart(
                        SESSION_ID, "Juan Perez", "3001234567", "1098765432", "Calle 1", "Bogotá", null, OrderChannel.ONLINE
                )
        );
        assertTrue(ex.getMessage().contains("precio válido"));
        verify(orderRepository, never()).save(any());
    }
}