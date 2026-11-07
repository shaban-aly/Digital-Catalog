# Feature Specification: Background Jobs & Data Retention (JOB-001)

**Feature Branch**: `019-background-jobs`

**Feature ID**: `JOB-001`

**Created**: 2026-11-06

**Status**: Ready for Planning

**Release**: MVP Core / Operations

**Input**: User directive: "تشغيل المعالجات الخلفية والصيانة الدورية للبيانات (ضغط إحصائيات المسح القديمة، تنظيف الإشعارات المقروءة المؤرشفة، مراجعة اشتراكات التجار المنتهية وتنبيههم) لضمان عدم امتلاء قاعدة البيانات المجانية والحفاظ على سرعة الاستجابة بأقل تكلفة $0."

---

## Purpose and Business Value

Provide the platform with a lightweight, idempotent, zero-infrastructure-cost **Background Job and Maintenance Engine (`JOB-001`)** that automates essential data hygiene tasks: compacting raw scan events into daily summaries to respect Supabase free-tier storage limits (500MB), pruning stale notifications, and verifying merchant subscription expiration dates without slowing down public catalog requests or customer QR redirections.

---

## Scope and Boundaries

- **In Scope**:
  - Idempotent maintenance job execution:
    - `compact_analytics`: Rolls up raw scan events older than retention window (30 days) and cleans up raw telemetry rows to conserve database storage.
    - `prune_notifications`: Cleans read notification records older than 90 days.
    - `check_subscriptions`: Identifies merchant subscriptions that have crossed their `subscription_expires_at` date, flags them, and queues an in-app notice (`NOT-001`).
  - Job execution logging: records `job_name`, `status` (`pending`, `running`, `completed`, `failed`), `started_at`, `completed_at`, `records_processed`, and `error_message`.
  - Secret-authorized HTTP trigger endpoint (`/api/cron/maintenance` with `CRON_SECRET` authorization bearer) compatible with Vercel Cron or GitHub Actions ($0/month).
  - Resilient, safe error handling: job failure never crashes server processes or affects customer traffic.
- **Out of Scope (Deferred to Future Releases)**:
  - Persistent 24/7 dedicated Redis BullMQ/Celery workers (violates Free-First $0 budget).
  - Heavy distributed streaming systems (Kafka / RabbitMQ).

---

## Actors and Permissions

- **Platform Automation / Cron Runner**: Executes scheduled jobs passing authorization bearer token (`CRON_SECRET`).
- **Platform Super Admin**: Can trigger maintenance jobs on demand from administrative tools.
- **Merchant & Public Visitor**: Zero direct access to trigger maintenance jobs.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Compacting Stale Analytics & Conserving Free-Tier Quota (Priority: P1)

As the platform operator, I want automated background maintenance to roll up raw QR scan events older than 30 days so that our database table remains lean and within Supabase free-tier storage boundaries.

**Why this priority**: Directly protects the Free-First ($0 budget) architecture by preventing database bloat.

**Independent Test**: Can be tested by inserting raw scan events older than 30 days, invoking `compactAnalytics(30)`, and verifying raw events are pruned while aggregate metrics remain accurate.

**Acceptance Scenarios**:

1. **Given** scan events older than 30 days, **When** `compactAnalytics` executes, **Then** historical summaries are preserved and stale raw event rows are safely cleaned up.
2. **Given** zero scan events older than 30 days, **When** `compactAnalytics` executes, **Then** the job completes cleanly with `records_processed: 0`.

---

### User Story 2 - Subscription Expiration Verification & Merchant Alerting (Priority: P1)

As a merchant whose offline Pro subscription expires, I want the system to detect expiration in the background and notify me in my dashboard inbox so I can renew via InstaPay / Vodafone Cash before disruption.

**Why this priority**: Essential customer lifecycle management and renewal retention.

**Independent Test**: Can be tested by setting `subscription_expires_at` to yesterday, running `checkSubscriptions()`, and verifying that a notification is created in `notifications` table.

**Acceptance Scenarios**:

1. **Given** a Pro merchant whose subscription passed `subscription_expires_at`, **When** the job runs, **Then** an Arabic expiration notification is queued and the business record is flagged.
2. **Given** an active merchant whose subscription is valid for 6 more months, **When** the job runs, **Then** the merchant's status and records remain unchanged.

---

## Technical Constraints & Design Principles

1. **Free-First ($0 Cost)**: Operates via stateless HTTP cron or on-demand service execution without dedicated servers.
2. **Idempotency**: Running a job multiple times produces identical, safe outcomes without duplicated rollups.
3. **Non-Blocking Architecture**: Background tasks never delay customer-facing web responses.
4. **Zod 4 Compliance**: Job status, execution logs, and trigger parameters strictly validated.
