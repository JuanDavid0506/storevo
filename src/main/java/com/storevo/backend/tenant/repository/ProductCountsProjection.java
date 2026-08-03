package com.storevo.backend.tenant.repository;

public interface ProductCountsProjection {
    Long getTodos();
    Long getActivos();
    Long getOcultos();
    Long getBorradores();
    Long getPapelera();
}