package com.stockflow.security;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * RBAC matrix (spec §6):
 *   ADMIN         -> users, roles, settings, categories, products, global supervision
 *   STOCK_MANAGER -> stock IN/OUT, quantity control, alert monitoring
 *   SELLER        -> sales recording (ventes), product lookup, commercial ops
 *   MANAGER       -> statistics, sales, stock state, activity reports (read-only oversight)
 *
 * CORS allowed origins are driven by the {@code app.cors.allowed-origins} property
 * so that dev profiles can use "*" and prod profile can use a strict whitelist.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private static final String ADMIN = "ADMIN";
    private static final String STOCK_MANAGER = "STOCK_MANAGER";
    private static final String SELLER = "SELLER";
    private static final String MANAGER = "MANAGER";

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final CustomUserDetailsService userDetailsService;
    private final JwtAuthenticationEntryPoint jwtAuthEntryPoint;

    @Value("${app.cors.allowed-origins:*}")
    private String[] allowedOrigins;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(jwtAuthEntryPoint)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // --- Public ---
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(
                                "/v3/api-docs/**",
                                "/v3/api-docs.yaml",
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/swagger-resources/**",
                                "/webjars/**"
                        ).permitAll()

                        // --- Users + Roles management: ADMIN only ---
                        .requestMatchers("/api/users/**").hasRole(ADMIN)
                        .requestMatchers("/api/roles/**").hasRole(ADMIN)

                        // --- Categories ---
                        .requestMatchers(HttpMethod.GET, "/api/categories/**")
                            .hasAnyRole(ADMIN, STOCK_MANAGER, SELLER, MANAGER)
                        .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole(ADMIN)

                        // --- Products ---
                        .requestMatchers(HttpMethod.GET, "/api/products/**")
                            .hasAnyRole(ADMIN, STOCK_MANAGER, SELLER, MANAGER)
                        .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole(ADMIN)
                        .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole(ADMIN)

                        // --- Stock movements ---
                        .requestMatchers(HttpMethod.GET, "/api/stock-movements/**")
                            .hasAnyRole(ADMIN, STOCK_MANAGER, MANAGER)
                        .requestMatchers(HttpMethod.POST, "/api/stock-movements/**")
                            .hasAnyRole(ADMIN, STOCK_MANAGER)
                        .requestMatchers(HttpMethod.PUT, "/api/stock-movements/**")
                            .hasAnyRole(ADMIN, STOCK_MANAGER)
                        .requestMatchers(HttpMethod.DELETE, "/api/stock-movements/**").hasRole(ADMIN)

                        // --- Ventes (single consolidated sales module) ---
                        .requestMatchers(HttpMethod.GET, "/api/ventes/**")
                            .hasAnyRole(ADMIN, SELLER, MANAGER)
                        .requestMatchers(HttpMethod.POST, "/api/ventes/**")
                            .hasAnyRole(ADMIN, SELLER)
                        .requestMatchers(HttpMethod.PUT, "/api/ventes/**")
                            .hasAnyRole(ADMIN, SELLER)
                        .requestMatchers(HttpMethod.DELETE, "/api/ventes/**").hasRole(ADMIN)

                        // --- Dashboard ---
                        .requestMatchers("/api/dashboard/**")
                            .hasAnyRole(ADMIN, STOCK_MANAGER, SELLER, MANAGER)

                        // --- Profile: any authenticated user ---
                        .requestMatchers("/api/profile/**").authenticated()

                        // Default deny: every other endpoint must be authenticated
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.asList(allowedOrigins);

        if (origins.size() == 1 && "*".equals(origins.get(0))) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            configuration.setAllowedOrigins(origins);
            configuration.setAllowCredentials(true);
        }
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
