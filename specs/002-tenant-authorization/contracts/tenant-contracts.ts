/**
 * Interface Contracts: Tenant Authorization & Membership (TEN-001)
 */

export type TenantRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface BusinessMemberRecord {
  id: string;
  businessId: string;
  userId: string;
  role: TenantRole;
  createdAt: string;
}

export interface ITenantAuthorizationService {
  /**
   * Retrieves the active business memberships for the current authenticated user.
   */
  getUserMemberships(userId: string): Promise<BusinessMemberRecord[]>;

  /**
   * Verifies if a user has sufficient role permissions within a specific business.
   */
  checkPermission(
    userId: string,
    businessId: string,
    requiredRole?: TenantRole
  ): Promise<boolean>;

  /**
   * Adds or invites a new member to a business (owner action only).
   */
  addMember(
    businessId: string,
    targetUserId: string,
    role: TenantRole
  ): Promise<BusinessMemberRecord>;

  /**
   * Removes a member from a business (owner action only).
   */
  removeMember(businessId: string, targetUserId: string): Promise<void>;
}

