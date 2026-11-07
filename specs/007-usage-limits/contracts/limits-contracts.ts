import type {
  PlanTierConfig,
  PaymentChannel,
  UsageMetrics,
  UpgradeWhatsAppRequest,
} from '../../../src/shared/types.ts';

/**
 * Interface Contracts: Entitlements and Usage Limits (LMT-001)
 */

export type { PlanTierConfig, PaymentChannel, UsageMetrics, UpgradeWhatsAppRequest };

export interface ILimitsService {
  /**
   * Calculates live product and category capacity metrics for a merchant
   */
  getUsageMetrics(businessId: string): Promise<UsageMetrics>;

  /**
   * Returns list of configured platform subscription tiers
   */
  getPlanTiers(): PlanTierConfig[];

  /**
   * Returns supported Egyptian payment channels (InstaPay, Vodafone Cash, Bank, Cards)
   */
  getAcceptedPaymentChannels(): PaymentChannel[];

  /**
   * Builds pre-filled WhatsApp link with receipt verification details
   */
  generateWhatsAppUpgradeUrl(request: UpgradeWhatsAppRequest): string;

  /**
   * Fast pre-check whether merchant has remaining product capacity
   */
  canCreateProduct(businessId: string): Promise<{ allowed: boolean; reason?: string }>;

  /**
   * Fast pre-check whether merchant has remaining category capacity
   */
  canCreateCategory(businessId: string): Promise<{ allowed: boolean; reason?: string }>;
}
