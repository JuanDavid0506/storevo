package com.storevo.backend.landing.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class LandingController {

    @GetMapping("/")
    public String showLandingPage() {
        return "landing/index"; // Esto buscará index.html dentro de la carpeta templates/landing/
    }
}