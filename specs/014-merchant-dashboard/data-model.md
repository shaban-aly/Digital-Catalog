# Data Model: Merchant Dashboard Workspace (MCH-001)

## 1. Dashboard State DTOs

```typescript
export interface DashboardBusinessSummary {
  id: string;
  name: string;
  slug: string;
  plan_code: string;
  max_products: number;
  max_categories: number;
  subdomainUrl: string;
  catalogPreviewUrl: string;
}

export interface DashboardMetricCard {
  labelAr: string;
  value: number;
  isEstimated: boolean;
  icon: string;
  tooltipAr?: string;
}
```

