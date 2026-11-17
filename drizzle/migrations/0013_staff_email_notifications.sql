alter table public.app_users add column if not exists receives_notifications boolean not null default false;

create or replace function public.app_list_staff(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', u.id::text, 'email', u.email, 'role', u.role, 'isActive', u.is_active,
      'receivesNotifications', u.receives_notifications
    ) order by u.created_at),
    '[]'::jsonb)
  from public.app_users u;
$$;

create or replace function public.app_set_staff_notifications(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  update public.app_users
  set receives_notifications = (payload->>'enabled')::boolean, updated_at = now()
  where id = (payload->>'id')::uuid;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.app_list_notification_recipients(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(jsonb_agg(lower(u.email)), '[]'::jsonb)
  from public.app_users u
  where u.is_active and u.receives_notifications;
$$;

revoke all on function public.app_set_staff_notifications(jsonb), public.app_list_notification_recipients(jsonb)
  from public, anon, authenticated;
grant execute on function public.app_set_staff_notifications(jsonb), public.app_list_notification_recipients(jsonb)
  to service_role;