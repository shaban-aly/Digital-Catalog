# Technical Research: Background Jobs & Data Retention (JOB-001)

## 1. Zero-Cost Serverless Scheduling Options

Traditional job queues (Sidekiq, BullMQ, Celery) require running a Redis instance and long-running Node/Python worker processes, costing upwards of \$10-25/month on cloud hosts. Under the **Free-First ($0 budget)** architecture:
- **Vercel Cron / GitHub Actions Scheduled Workflows**: Both platforms allow executing a webhook on a schedule (e.g. daily at 03:00 UTC) at zero financial cost.
- **Webhook Security**: Protected by an HTTP header `Authorization: Bearer <CRON_SECRET>`. The serverless route verifies this shared secret before invoking the maintenance service.
- **PostgreSQL `pg_cron`**: Supabase extensions include `pg_cron` natively on the free tier, allowing in-database scheduling for pure SQL retention tasks without external network round trips.

## 2. Retention Windows & Database Quota Protection

Supabase Free Tier provides **500MB** of PostgreSQL storage. Unchecked growth of raw analytics (`qr_scan_events`) from high-traffic cafeterias in Suez could consume database storage within 6-12 months.
- **Compaction Strategy**:
  - Keep raw `qr_scan_events` for 30 days for rich fraud detection and unique IP subnet verification.
  - After 30 days, ensure daily aggregate totals exist in `analytics_daily_rollups` / `daily_metrics`.
  - Delete raw rows older than 30 days.
  - This reduces storage per 10,000 scans from ~5MB down to ~10KB (a 99.8% storage saving).
