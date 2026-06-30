package com.storevo.backend.tenant.service;

import org.springframework.stereotype.Component;
import org.springframework.web.context.annotation.SessionScope;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Component
@SessionScope
public class WishlistManager {

    // Mapa: Slug de la Tienda -> Set de IDs de Productos Favoritos
    private final Map<String, Set<Long>> storeWishlists = new HashMap<>();

    public Set<Long> getWishlist(String slug) {
        return storeWishlists.computeIfAbsent(slug, k -> new HashSet<>());
    }

    // Devuelve TRUE si se agregó, FALSE si se eliminó (Toggle)
    public boolean toggleItem(String slug, Long productId) {
        Set<Long> wishlist = getWishlist(slug);
        if (wishlist.contains(productId)) {
            wishlist.remove(productId);
            return false;
        } else {
            wishlist.add(productId);
            return true;
        }
    }

    public int getWishlistCount(String slug) {
        return getWishlist(slug).size();
    }
}