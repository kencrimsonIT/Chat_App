package com.messapp.backend.security;

import com.messapp.backend.exception.RateLimitException;
import com.messapp.backend.service.RateLimitingService;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    @Autowired
    private RateLimitingService rateLimitingService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.equals("/api/auth/forgot-password")) {
            String clientIp = getClientIP(request);
            Bucket bucket = rateLimitingService.resolveBucket(clientIp);
            ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

            if (!probe.isConsumed()) {
                long waitForRefill = probe.getNanosToWaitForRefill() / 1_000_000_000;
                response.setStatus(429);
                response.setHeader("X-Rate-Limit-Retry-After-Seconds", String.valueOf(waitForRefill));
                response.setContentType("application/json");
                response.getWriter().write("{\"status\": 429, \"message\": \"Too many requests. Please try again in " + waitForRefill + " seconds.\", \"timestamp\": \"" + LocalDateTime.now() + "\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}