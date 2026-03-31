import type { AuditEventDto, AuditEvent } from './audit-event.types';

export class AuditEventMapper {
  static fromDto(dto: AuditEventDto): AuditEvent {
    const occurredAt = new Date(dto.occurredAt);
    return {
      id:             dto.id,
      action:         dto.action,
      actionLabel:    AuditEventMapper.buildActionLabel(dto.action),
      entityType:     dto.entityType,
      entityId:       dto.entityId,
      actorId:        dto.actorId,
      actorEmail:     dto.actorEmail,
      payload:        dto.payload ?? {},
      ipAddress:      dto.ipAddress ?? '',
      occurredAt,
      occurredAtLabel: AuditEventMapper.formatDate(occurredAt),
    };
  }

  static fromDtoList(dtos: AuditEventDto[]): AuditEvent[] {
    return dtos.map(dto => AuditEventMapper.fromDto(dto));
  }

  private static buildActionLabel(action: string): string {
    const parts = action.split('.');
    if (parts.length === 0) return action;
    const first = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    if (parts.length === 1) return first;
    return [first, ...parts.slice(1)].join(' › ');
  }

  private static formatDate(date: Date): string {
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }
}
