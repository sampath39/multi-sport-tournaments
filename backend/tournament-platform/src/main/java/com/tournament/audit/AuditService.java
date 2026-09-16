package com.tournament.audit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an audit event asynchronously.
     * All tournament-critical changes MUST be logged.
     */
    @Async
    public void log(UUID actorId, String action, String entityType, UUID entityId,
                    Map<String, Object> oldValue, String reason, Map<String, Object> newValue) {
        try {
            AuditLog auditLog = AuditLog.builder()
                .actorId(actorId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .oldValue(oldValue)
                .newValue(newValue)
                .reason(reason)
                .build();
            auditLogRepository.save(auditLog);
        } catch (Exception e) {
            log.error("Failed to write audit log: action={} entity={}/{} error={}",
                action, entityType, entityId, e.getMessage());
        }
    }

    @Async
    public void logAction(UUID actorId, String action, String entityType, UUID entityId) {
        log(actorId, action, entityType, entityId, null, null, null);
    }
}
