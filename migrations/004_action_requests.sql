-- Action requests drive the dashboard "Action Required" dependency queue.
create table if not exists action_requests (
  id text primary key,
  workspace_id text not null,
  title text not null,
  description text,
  requested_from_type text not null check (requested_from_type in ('person', 'organization', 'group', 'projectTeam')),
  requested_from_id text,
  context_label text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  status text not null default 'active' check (status in ('active', 'resolved', 'archived')),
  link_type text not null check (link_type in ('project', 'client', 'inbox', 'update', 'admin', 'custom')),
  link_target text not null,
  sort_order integer,
  created_by text not null,
  updated_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists action_requests_workspace_status_idx
  on action_requests (workspace_id, status);

create index if not exists action_requests_priority_due_created_idx
  on action_requests (priority, due_date, created_at desc);

create index if not exists action_requests_sort_order_idx
  on action_requests (workspace_id, sort_order);

-- Align existing installations to the new "Task for" targeting model.
alter table if exists action_requests
  drop constraint if exists action_requests_requested_from_type_check;

alter table if exists action_requests
  add constraint action_requests_requested_from_type_check
  check (requested_from_type in ('person', 'organization', 'group', 'projectTeam'));
