package com.stockflow.dto.response;

import lombok.*;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
    private String token;
    private String type = "Bearer";
    private Long id;
    private String name;
    private String email;
    private String role;
    /** Permission codes inherited from the assigned role. */
    private Set<String> permissions;

    public AuthResponse(String token, Long id, String name, String email, String role, Set<String> permissions) {
        this.token = token;
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.permissions = permissions == null ? new HashSet<>() : permissions;
    }
}
