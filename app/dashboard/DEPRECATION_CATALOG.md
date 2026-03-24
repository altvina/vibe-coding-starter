# Dashboard Deprecation Catalog

This file tracks quarantined dashboard surfaces that are disabled in runtime navigation and
scheduled for full deletion after replacement tooling is finalized.

## Quarantined now

- `CRM` surface
  - Runtime status: disabled from active navigation; direct CRM route redirects back to dashboard.
  - Paths: `app/dashboard/crm`, `app/api/crm`.
  - Hard-delete trigger: platform replacement approved and historical CRM data no longer required.

- `Projects` internal tool
  - Runtime status: removed from active module registry and replaced by disabled placeholder page.
  - Paths: `app/dashboard/modules/projects`, `app/dashboard/projects/page.tsx`.
  - Hard-delete trigger: Plane integration confirmed as canonical projects workflow.

- `Inbox` email system
  - Runtime status: inbox icon kept as nav placeholder; email features removed from module behavior.
  - Paths: `app/dashboard/modules/inbox`, `app/dashboard/inbox/page.tsx`, `app/dashboard/_components/inbox-content.tsx`.
  - Hard-delete trigger: replacement messaging/email architecture chosen and implemented.

- `Performance Evaluation` dashboard block
  - Runtime status: removed from active shell/sidebar payload and UI rendering.
  - Paths: `app/dashboard/_components/sidebar.tsx`, `app/dashboard/dashboard-shell.tsx`, `app/dashboard/dashboard-context.tsx`, `app/api/dashboard/route.ts`.
  - Design note: preserve the removed visual pattern as reference for future metric cards.

- `Revenue Analytics` functionality
  - Runtime status: fully removed from analytics module/page and API response contract.
  - Paths: `app/dashboard/modules/analytics/manifest.tsx`, `app/dashboard/_components/analytics-content.tsx`, `app/dashboard/dashboard-context.tsx`, `app/dashboard/dashboard-data.ts`, `app/api/dashboard/route.ts`.
  - Hard-delete trigger: none pending; removal complete in this pass.

## Deletion checklist template

For each quarantined area before full deletion:

1. Confirm no active route/nav entry exists.
2. Confirm no module registry references remain.
3. Confirm no API consumers depend on related response fields.
4. Remove dead imports/components/routes.
5. Run lint/type diagnostics and role-based smoke check.
