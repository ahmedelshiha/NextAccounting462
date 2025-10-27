# Log Fixes — TODO Checklist

1) Audit PageHeader consumers for icon/array issues
   - [ ] Grep for PageHeader and StandardPage usages
   - [ ] Replace any JSX icon (<Icon />) with component reference (Icon)
   - [ ] Ensure primaryAction is an object, not an array
   - [ ] Prefer StandardPage over direct PageHeader
   - Files: src/app/admin/**/*, src/components/admin/**/*

2) Align validator and sanitizer policies
   - [ ] Option A: Downgrade React element icons to warnings in validateIcon (treat as valid)
   - [ ] Option B: Keep strict; guarantee sanitization in StandardPage and other containers
   - Files: src/utils/actionItemValidator.ts, src/components/dashboard/templates/StandardPage.tsx

3) Harden /api/admin/tasks/analytics (fix 500)
   - [ ] Add structured logging around each prisma call
   - [ ] Verify tenantFilter applied to all queries
   - [ ] Validate complianceRecord relations exist and are tenant-scoped
   - [ ] Return dev-friendly error details when NODE_ENV=development
   - [ ] Add unit/e2e tests
   - Files: src/app/api/admin/tasks/analytics/route.ts, prisma/schema.prisma

4) Handle 401/403 for stats endpoints gracefully
   - [ ] Route all calls via apiFetch and handle 401/403 centrally
   - [ ] Show fallback card with CTA when unauthorized
   - Files: src/hooks/useServicesData.ts, src/app/admin/page.tsx, src/lib/api-fetch.ts (or equivalent)

5) Improve performance observability
   - [ ] Include entry.name (URL) in threshold logs for apiResponseTime
   - [ ] Add sampling to usePerformanceMonitoring to reduce noise
   - [ ] Add server timings and slow-query logging for Prisma
   - Files: src/hooks/usePerformanceMonitoring.ts, src/lib/logger.ts, src/lib/prisma.ts

6) Optional hygiene
   - [ ] Remove/feature-flag third‑party ad iframes if not needed

7) Verification
   - [ ] Reload admin pages: console free of PageHeader 🚨 logs
   - [ ] /api/admin/tasks/analytics returns 200 with valid shape
   - [ ] Perf logs show endpoint names; p95 < 1s for most /api/*
   - [ ] 401/403 handled with graceful UI
