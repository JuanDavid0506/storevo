package com.storevo.backend.config.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentLinkedDeque;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class RateLimitService {

    public static final String RATE_LIMIT_MESSAGE =
            "Has realizado demasiados intentos seguidos. Por favor espera un minuto antes de volver a intentarlo.";

    private static final int MAX_BUCKETS = 25000;

    private record BucketEntry(Deque<Long> timestamps, long windowMillis) {}

    private final Map<String, BucketEntry> buckets = new ConcurrentHashMap<>();
    private final AtomicLong lastCleanupMs = new AtomicLong(0);

    /**
     * Valida y consume 1 intento para la clave indicada dentro de la ventana de tiempo.
     * Devuelve true si la petición está permitida, o false si superó el límite.
     */
    public boolean tryConsume(String bucketKey, int maxRequests, Duration window) {
        if (bucketKey == null || bucketKey.isBlank() || maxRequests <= 0 || window == null) {
            return true;
        }
        if (buckets.size() > MAX_BUCKETS) {
            cleanupExpiredBuckets();
        }

        long now = System.currentTimeMillis();
        long windowMs = Math.max(1000L, window.toMillis());
        long cutoff = now - windowMs;

        BucketEntry entry = buckets.computeIfAbsent(
                bucketKey,
                k -> new BucketEntry(new ConcurrentLinkedDeque<>(), windowMs)
        );

        synchronized (entry) {
            Deque<Long> q = entry.timestamps();
            while (!q.isEmpty() && q.peekFirst() <= cutoff) {
                q.pollFirst();
            }
            if (q.size() >= maxRequests) {
                return false;
            }
            q.addLast(now);
            return true;
        }
    }

    public boolean tryConsumeByIp(HttpServletRequest request, String actionScope, int maxRequests, Duration window) {
        String ip = resolveClientIp(request);
        return tryConsume(actionScope + ":" + ip, maxRequests, window);
    }

    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "unknown";
        }
        String remoteAddr = request.getRemoteAddr();
        return (remoteAddr != null && !remoteAddr.isBlank()) ? remoteAddr.trim() : "unknown";
    }

    @Scheduled(fixedDelay = 300000L, initialDelay = 300000L)
    public void cleanupExpiredBuckets() {
        long now = System.currentTimeMillis();
        long last = lastCleanupMs.get();
        if (!(now - last > 60_000L && lastCleanupMs.compareAndSet(last, now))) {
            return;
        }
        for (String key : buckets.keySet()) {
            BucketEntry bucket = buckets.get(key);
            if (bucket == null) {
                buckets.remove(key);
                continue;
            }
            synchronized (bucket) {
                long cutoff = now - bucket.windowMillis();
                Deque<Long> q = bucket.timestamps();
                while (!q.isEmpty() && q.peekFirst() <= cutoff) {
                    q.pollFirst();
                }
                if (q.isEmpty()) {
                    buckets.remove(key, bucket);
                }
            }
        }
    }
}