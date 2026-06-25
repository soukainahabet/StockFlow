package com.stockflow.security;

import com.stockflow.model.Permission;
import com.stockflow.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@AllArgsConstructor
@Getter
public class CustomUserDetails implements UserDetails {

    private final User user;

    /**
     * Authorities granted to the user:
     * <ul>
     *   <li>{@code ROLE_<NAME>} — drives {@code hasRole(...)} checks in SecurityConfig.</li>
     *   <li>{@code PERM_<CODE>} — one per permission inherited from the assigned role.</li>
     * </ul>
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getName()));
        if (user.getRole().getPermissions() != null) {
            for (Permission permission : user.getRole().getPermissions()) {
                authorities.add(new SimpleGrantedAuthority("PERM_" + permission.getCode()));
            }
        }
        return authorities;
    }

    @Override
    public String getPassword() {
        return user.getPassword();
    }

    @Override
    public String getUsername() {
        return user.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    public Long getId() {
        return user.getId();
    }

    public String getName() {
        return user.getName();
    }

    public String getRole() {
        return user.getRole().getName();
    }
}
