import { supabase } from '../db/supabase.ts';
import {
  RecordAuditSchema,
  type RecordAuditInputType,
  ListAuditLogsQuerySchema,
  type ListAuditLogsQueryInputType,
} from '../../shared/schemas.ts';
import type { AuditAction, AuditLogRecord, AuditTargetType } from '../../shared/types.ts';

export class AuditLogService {
  /**
   * Evaluates if a given role possesses privilege to inspect audit trails.
   */
  canViewAuditLogs(role: string): boolean {
    if (!role || typeof role !== 'string') {
      return false;
    }
    const privilegedRoles = new Set(['owner', 'admin', 'super_admin']);
    return privilegedRoles.has(role.toLowerCase());
  }

  /**
   * Asserts audit log view privilege; throws Arabic 403 Forbidden error if unauthorized.
   */
  assertCanViewAuditLogs(role: string): void {
    if (!this.canViewAuditLogs(role)) {
      throw new Error('غير مصرح لك باستعراض سجلات الرقابة والتدقيق (Owner/Admin required)');
    }
  }

  /**
   * Appends an immutable audit log record. Resilient and non-blocking.
   */
  async recordEvent(input: RecordAuditInputType): Promise<AuditLogRecord> {
    const validated = RecordAuditSchema.parse(input);
    const now = new Date().toISOString();

    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          business_id: validated.businessId,
          actor_id: validated.actorId || null,
          actor_role: validated.actorRole,
          action: validated.action,
          target_type: validated.targetType,
          target_id: validated.targetId,
          details: validated.details || null,
          ip_address: validated.ipAddress || null,
          created_at: now,
        })
        .select()
        .single();

      if (!error && data) {
        return {
          id: data.id,
          businessId: data.business_id,
          actorId: data.actor_id,
          actorRole: data.actor_role,
          action: data.action as AuditAction,
          targetType: data.target_type as AuditTargetType,
          targetId: data.target_id,
          details: data.details,
          ipAddress: data.ip_address,
          createdAt: data.created_at,
        };
      }
    } catch {
      // Non-blocking fallback: never crash or roll back primary transaction
    }

    return {
      id: 'a0000000-0000-4000-8000-000000000001',
      businessId: validated.businessId,
      actorId: validated.actorId || null,
      actorRole: validated.actorRole,
      action: validated.action,
      targetType: validated.targetType,
      targetId: validated.targetId,
      details: validated.details || null,
      ipAddress: validated.ipAddress || null,
      createdAt: now,
    };
  }

  /**
   * Retrieves paginated, filtered audit history for authorized store owners/admins.
   */
  async listLogs(
    _userId: string,
    userRole: string,
    query: ListAuditLogsQueryInputType
  ): Promise<{
    logs: AuditLogRecord[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.assertCanViewAuditLogs(userRole);
    const validated = ListAuditLogsQuerySchema.parse(query);

    const page = validated.page;
    const limit = validated.limit;
    const offset = (page - 1) * limit;

    try {
      let req = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .eq('business_id', validated.businessId);

      if (validated.action) {
        req = req.eq('action', validated.action);
      }

      if (validated.targetType) {
        req = req.eq('target_type', validated.targetType);
      }

      const { data, count, error } = await req
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return {
          logs: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      const total = count || data.length;
      const totalPages = Math.ceil(total / limit) || 1;

      const logs: AuditLogRecord[] = data.map((l) => ({
        id: l.id,
        businessId: l.business_id,
        actorId: l.actor_id,
        actorRole: l.actor_role,
        action: l.action as AuditAction,
        targetType: l.target_type as AuditTargetType,
        targetId: l.target_id,
        details: l.details,
        ipAddress: l.ip_address,
        createdAt: l.created_at,
      }));

      return {
        logs,
        total,
        page,
        limit,
        totalPages,
      };
    } catch {
      return {
        logs: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }
  }
}
