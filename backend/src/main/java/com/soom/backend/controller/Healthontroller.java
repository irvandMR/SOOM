package com.soom.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class Healthontroller {

    @GetMapping("/api/health")
    public String health(){
        return "SOOM Backend is Running";
    }
}
