import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from './api-client';
import { AuditEventMapper } from '../../../entities/audit-event/audit-event.mapper';
import type { AuditEventDto, AuditEvent } from '../../../entities/audit-event/audit-event.types';
import type { PaginatedResponse, PaginationParams } from '../../types';

export interface AuditEventListParams extends PaginationParams {
  entityType?: string;
  action?: string;
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

@Injectable({ providedIn: 'root' })
export class AuditEventService {
  private readonly api = inject(ApiClient);

  getAll(params: AuditEventListParams): Observable<PaginatedResponse<AuditEvent>> {
    return this.api.get<PaginatedResponse<AuditEventDto>>('/admin/audit-events', {
      page: params.page,
      pageSize: params.pageSize,
      ...(params.entityType && { entityType: params.entityType }),
      ...(params.action     && { action:     params.action }),
      ...(params.actorId    && { actorId:    params.actorId }),
      ...(params.dateFrom   && { dateFrom:   params.dateFrom }),
      ...(params.dateTo     && { dateTo:     params.dateTo }),
    }).pipe(
      map(response => ({
        data: AuditEventMapper.fromDtoList(response.data),
        meta: response.meta,
      }))
    );
  }

  getById(id: string): Observable<AuditEvent> {
    return this.api.get<AuditEventDto>(`/admin/audit-events/${id}`).pipe(
      map(dto => AuditEventMapper.fromDto(dto))
    );
  }
}
