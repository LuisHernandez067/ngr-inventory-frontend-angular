// ─── DTOs ───
export interface AuditEventDto {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string;
  actorEmail: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  occurredAt: string;  // ISO
}

// ─── ViewModels ───
export interface AuditEvent {
  id: string;
  action: string;
  actionLabel: string;       // e.g. 'product.created' → 'Product › created'
  entityType: string;
  entityId: string;
  actorId: string;
  actorEmail: string;
  payload: Record<string, unknown>;  // {} if undefined
  ipAddress: string;                 // '' if undefined
  occurredAt: Date;
  occurredAtLabel: string;           // 'dd/MM/yyyy HH:mm'
}
