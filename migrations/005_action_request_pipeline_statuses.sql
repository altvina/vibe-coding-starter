-- Expand action request workflow statuses for pipeline-style admin UX.
alter table if exists action_requests
  drop constraint if exists action_requests_status_check;

alter table if exists action_requests
  add constraint action_requests_status_check
  check (status in ('active', 'in_progress', 'waiting', 'resolved', 'archived'));
