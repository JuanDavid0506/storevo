package com.storevo.backend.tenant.controller;

import com.storevo.backend.admin.model.Store;
import com.storevo.backend.config.tenant.TenantContext;
import com.storevo.backend.tenant.dto.CustomerDto;
import com.storevo.backend.tenant.model.Order;
import com.storevo.backend.tenant.model.OrderChannel;
import com.storevo.backend.tenant.service.CustomerService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.UriUtils;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Controller
@RequestMapping("/dashboard/{slug}/customers")
@RequiredArgsConstructor
public class DashboardCustomerController {

    private final CustomerService customerService;

    @ModelAttribute
    public void setupTenant(@PathVariable String slug, Model model, HttpServletRequest request) {
        Store store = (Store) request.getAttribute("currentStore");
        if (store == null) {
            throw new RuntimeException("Tienda no encontrada en la petición");
        }

        // 1. Pasamos la data básica
        model.addAttribute("store", store);
        model.addAttribute("slug", slug);

        // 2. Bajamos el switch al schema del tenant
        TenantContext.setCurrentTenant(store.getSchemaName());
    }

    @GetMapping
    public String listCustomers(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) OrderChannel channel,
            @RequestParam(required = false, defaultValue = "last_order_desc") String sort,
            @PageableDefault(size = 10) Pageable pageable,
            Model model) {

        Page<CustomerDto> page = customerService.searchCustomers(q, type, channel, sort, pageable);

        model.addAttribute("page", page);
        model.addAttribute("customers", page.getContent());
        model.addAttribute("pageTitle", "Mis Clientes");
        return "dashboard/customers/index";
    }

    @GetMapping("/detail")
    public String customerDetail(
            @PathVariable String slug,
            @RequestParam("phone") String phone,
            Model model) {

        CustomerDto customer = customerService.getCustomerByPhone(phone);
        if (customer == null) {
            return "redirect:/dashboard/" + slug + "/customers";
        }

        List<Order> customerOrders = customerService.getOrdersByCustomerPhone(phone);

        model.addAttribute("customer", customer);
        model.addAttribute("customerOrders", customerOrders);
        model.addAttribute("customerChannels", customer.getChannels());
        model.addAttribute("customerEmail", customer.getEmail());
        model.addAttribute("customerAddress", customer.getAddress());
        model.addAttribute("customerDocument", customer.getDocument());
        model.addAttribute("customerDocumentType", customer.getDocumentType());
        model.addAttribute("customerVerificationDigit", customer.getVerificationDigit());
        model.addAttribute("customerLegalName", customer.getLegalName());
        model.addAttribute("customerTaxRegime", customer.getTaxRegime());
        model.addAttribute("pageTitle", customer.getName());

        return "dashboard/customers/detail";
    }

    @PostMapping("/update")
    public String updateCustomer(
            @PathVariable String slug,
            @RequestParam String originalPhone,
            @RequestParam String name,
            @RequestParam String phone,
            @RequestParam(required = false) String documentType,
            @RequestParam(required = false) String document,
            @RequestParam(required = false) String verificationDigit,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String legalName,
            @RequestParam(required = false) String taxRegime) {

        customerService.updateCustomerData(
                originalPhone, name, phone, documentType, document,
                verificationDigit, email, city, address, legalName, taxRegime
        );

        String targetPhone = (phone != null && !phone.isBlank()) ? phone.trim() : originalPhone;
        String encodedPhone = UriUtils.encodeQueryParam(targetPhone, StandardCharsets.UTF_8);
        return "redirect:/dashboard/" + slug + "/customers/detail?phone=" + encodedPhone + "&success=true";
    }
}