import { supabase } from '../db/supabase.ts';
import type { TenantRole, BusinessMemberRecord, ITenantAuthorizationService } from '../../../specs/002-tenant-authorization/contracts/tenant-contracts.ts';

const ROLE_HIERARCHY: Record<TenantRole, number> = {
  viewer: 1,
  editor: 2,
  admin: 3,
  owner: 4,
};

/**
 * Evaluates whether a user's role satisfies the required minimum role.
 */
export function hasMinimumRole(userRole: TenantRole, requiredRole: TenantRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

export class TenantAuthorizationService implements ITenantAuthorizationService {
  async getUserMemberships(userId: string): Promise<BusinessMemberRecord[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('business_members')
      .select('id, business_id, user_id, role, created_at')
      .eq('user_id', userId);

    if (error) {
      console.warn('[TenantAuth] Failed to load user memberships:', error.message);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      businessId: row.business_id,
      userId: row.user_id,
      role: row.role as TenantRole,
      createdAt: row.created_at,
    }));
  }

  async checkPermission(
    userId: string,
    businessId: string,
    requiredRole: TenantRole = 'viewer'
  ): Promise<boolean> {
    if (!userId || !businessId) return false;

    const { data, error } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', businessId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    const currentRole = data.role as TenantRole;
    return hasMinimumRole(currentRole, requiredRole);
  }

  async addMember(
    businessId: string,
    targetUserId: string,
    role: TenantRole
  ): Promise<BusinessMemberRecord> {
    const { data, error } = await supabase
      .from('business_members')
      .insert({
        business_id: businessId,
        user_id: targetUserId,
        role,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add business member: ${error.message}`);
    }

    return {
      id: data.id,
      businessId: data.business_id,
      userId: data.user_id,
      role: data.role as TenantRole,
      createdAt: data.created_at,
    };
  }

  async removeMember(businessId: string, targetUserId: string): Promise<void> {
    const { error } = await supabase
      .from('business_members')
      .delete()
      .eq('business_id', businessId)
      .eq('user_id', targetUserId);

    if (error) {
      throw new Error(`Failed to remove business member: ${error.message}`);
    }
  }
}

export const tenantAuthService = new TenantAuthorizationService();
