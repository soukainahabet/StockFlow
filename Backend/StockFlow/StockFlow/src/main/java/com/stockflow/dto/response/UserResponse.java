package com.stockflow.dto.response;

import com.stockflow.model.Permission;
import com.stockflow.model.User;
import lombok.*;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    /** Permission codes inherited from the role. Empty for users on roles with no permissions. */
    private Set<String> permissions;

    public static UserResponse fromEntity(User user) {
        Set<String> codes = user.getRole().getPermissions() == null
                ? new HashSet<>()
                : user.getRole().getPermissions().stream()
                        .map(Permission::getCode)
                        .collect(Collectors.toCollection(HashSet::new));
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().getName())
                .permissions(codes)
                .build();
    }
}
