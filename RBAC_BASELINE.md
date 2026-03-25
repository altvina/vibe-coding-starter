# Dash RBAC Baseline (Pre-Refactor)

This file locks the baseline assumptions used for the workspace-scoped RBAC refactor.

## Current Auth and Session Shape

- Dash authentication is simulated in the client.
- The dashboard role is persisted in local storage and sent as query params.
- `app/api/dashboard/route.ts` derives effective access from query params plus in-memory workspace seeds.
- No app-level middleware enforces authentication.

## Current Workspace Access Model

- Workspace data is seeded in `app/api/dashboard/route.ts`.
- Access is decided by static member IDs mapped from the simulated role.
- Active workspace is selected in client state and echoed to API as `workspaceId`.

## Current Permission Model

- Permissions are global-role-based (`dashboard-permissions.ts`) rather than workspace-scoped.
- UI and API checks are mixed across components and handlers.

## Migration Direction

- Keep Dash as a thin aggregation layer.
- Move authorization to workspace memberships (`role`, `status`, `toolAccess`, optional overrides).
- Evaluate role and permission only in the context of the active workspace.
