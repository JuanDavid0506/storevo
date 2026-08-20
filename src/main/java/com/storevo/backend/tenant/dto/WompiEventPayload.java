package com.storevo.backend.tenant.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class WompiEventPayload {
    private String event;
    private EventData data;
    private String environment;
    private Signature signature;
    private Long timestamp;

    @Data
    public static class EventData {
        private Transaction transaction;
    }

    @Data
    public static class Transaction {
        private String id;
        private String status;
        private String reference;
        @JsonProperty("amount_in_cents")
        private long amountInCents;
    }

    @Data
    public static class Signature {
        private String[] properties;
        private String checksum;
    }
}