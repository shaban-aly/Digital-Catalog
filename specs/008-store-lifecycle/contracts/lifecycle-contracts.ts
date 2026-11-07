import { z } from 'zod';
import type { BusinessStatus, StoreLifecycleResolution } from '../../../src/shared/types.ts';
import {
  ToggleCatalogPublishSchema,
  UpdateBusinessStatusSchema,
  ResolveStoreAvailabilitySchema,
  type ToggleCatalogPublishInput,
  type UpdateBusinessStatusInput,
  type ResolveStoreAvailabilityInput,
} from '../../../src/shared/schemas.ts';

export {
  ToggleCatalogPublishSchema,
  UpdateBusinessStatusSchema,
  ResolveStoreAvailabilitySchema,
  type ToggleCatalogPublishInput,
  type UpdateBusinessStatusInput,
  type ResolveStoreAvailabilityInput,
};

export interface LifecycleServiceInterface {
  setCatalogPublication(
    businessId: string,
    catalogId: string,
    isPublished: boolean
  ): Promise<{ id: string; is_published: boolean }>;

  setBusinessStatus(
    businessId: string,
    status: BusinessStatus,
    reason?: string
  ): Promise<{ id: string; status: BusinessStatus }>;

  resolveStoreAvailability(businessSlug: string): Promise<StoreLifecycleResolution>;
}
