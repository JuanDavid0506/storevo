package com.storevo.backend.config.web;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SeoRobotsController {

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public String robotsTxt() {
        return "User-agent: *\n"
                + "Allow: /s/\n"
                + "Disallow: /dashboard/\n"
                + "Disallow: /s/*/cart\n"
                + "Disallow: /s/*/order/\n";
    }
}