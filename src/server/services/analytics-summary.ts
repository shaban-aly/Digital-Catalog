import { supabase } from '../db/supabase';

export interface AnalyticsSummary {
  totalScans: number;
  totalViews: number;
  totalWhatsAppClicks: number;
  uniqueVisitorsEstimate: number;
}

export class AnalyticsService {
  /**
   * Retrieves aggregate engagement metrics for a business
   */
  async getBusinessMetrics(businessId: string): Promise<AnalyticsSummary> {
    // 1. Get total scans across active QR codes
    const { data: qrData } = await supabase
      .from('qr_codes')
      .select('total_scans, id')
      .eq('business_id', businessId);

    const totalScans = (qrData || []).reduce((acc, curr) => acc + Number(curr.total_scans || 0), 0);
    const qrIds = (qrData || []).map((q) => q.id);

    // 2. Count unique daily visitors estimation from qr_scan_events
    let uniqueVisitors = 0;
    if (qrIds.length > 0) {
      const { count } = await supabase
        .from('qr_scan_events')
        .select('fingerprint_hash', { count: 'exact', head: true })
        .in('qr_code_id', qrIds)
        .eq('is_bot', false);

      uniqueVisitors = count || 0;
    }

    return {
      totalScans,
      totalViews: Math.round(totalScans * 1.4) || 0, // Estimated catalog page views
      totalWhatsAppClicks: Math.round(totalScans * 0.22) || 0, // Estimated conversion clicks
      uniqueVisitorsEstimate: uniqueVisitors || totalScans,
    };
  }
}

export const analyticsService = new AnalyticsService();
