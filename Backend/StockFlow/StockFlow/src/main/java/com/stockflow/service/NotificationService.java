package com.stockflow.service;

import com.stockflow.dto.response.NotificationResponse;
import com.stockflow.dto.response.PageResponse;
import com.stockflow.exception.ResourceNotFoundException;
import com.stockflow.model.Notification;
import com.stockflow.model.NotificationType;
import com.stockflow.model.User;
import com.stockflow.repository.NotificationRepository;
import com.stockflow.repository.UserRepository;
import com.stockflow.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public PageResponse<NotificationResponse> listForCurrentUser(Pageable pageable) {
        Long me = currentUserId();
        Page<Notification> page = notificationRepository
                .findByRecipientIdOrderByCreatedAtDesc(me, pageable);
        return PageResponse.from(page, NotificationResponse::fromEntity);
    }

    public long unreadCountForCurrentUser() {
        return notificationRepository.countByRecipientIdAndReadFalse(currentUserId());
    }

    @Transactional
    public NotificationResponse markRead(Long id) {
        Long me = currentUserId();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", id));
        if (!notification.getRecipient().getId().equals(me)) {
            // Treat as "not found" to avoid leaking the existence of others' notifications.
            throw new ResourceNotFoundException("Notification", "id", id);
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public int markAllRead() {
        return notificationRepository.markAllReadForRecipient(currentUserId());
    }

    /**
     * Fan-out helper: persist one {@link Notification} per active user whose role name
     * is in {@code roleNames}. Errors during persistence are logged but do not bubble
     * up — a failed notification must never break the domain action that triggered it
     * (sale recorded, stock movement, etc.).
     */
    @Transactional
    public void notifyByRoles(Collection<String> roleNames,
                              NotificationType type,
                              String title,
                              String message,
                              String linkUrl) {
        if (roleNames == null || roleNames.isEmpty()) return;
        try {
            List<User> recipients = userRepository.findByRoleNameIn(roleNames);
            if (recipients.isEmpty()) {
                log.debug("No recipients for roles={} type={}", roleNames, type);
                return;
            }
            List<Notification> batch = new ArrayList<>(recipients.size());
            LocalDateTime now = LocalDateTime.now();
            for (User user : recipients) {
                batch.add(Notification.builder()
                        .recipient(user)
                        .type(type)
                        .title(title)
                        .message(message)
                        .linkUrl(linkUrl)
                        .read(false)
                        .createdAt(now)
                        .build());
            }
            notificationRepository.saveAll(batch);
            log.debug("Fan-out notification type={} to {} recipient(s)", type, batch.size());
        } catch (Exception e) {
            log.warn("Notification fan-out failed (type={}, roles={}): {}",
                    type, roleNames, e.getMessage());
        }
    }

    private Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return userDetails.getId();
    }
}
