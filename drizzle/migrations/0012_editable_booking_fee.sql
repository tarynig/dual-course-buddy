create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
insert into public.app_settings (key, value) values ('booking_fee', '500')
  on conflict (key) do nothing;

create or replace function public.app_get_booking_fee(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object('amount',
    coalesce((select value::numeric from public.app_settings where key = 'booking_fee'), 500));
$$;

create or replace function public.app_set_booking_fee(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_amount numeric := (payload->>'amount')::numeric;
begin
  if v_amount is null or v_amount < 1 or v_amount > 100000 then
    return jsonb_build_object('ok', false, 'error', 'Enter an amount between R1 and R100 000.');
  end if;
  insert into public.app_settings (key, value, updated_at)
    values ('booking_fee', v_amount::text, now())
    on conflict (key) do update set value = excluded.value, updated_at = now();
  return jsonb_build_object('ok', true, 'amount', v_amount);
end;
$$;

revoke all on function public.app_get_booking_fee(jsonb), public.app_set_booking_fee(jsonb)
  from public, anon, authenticated;
grant execute on function public.app_get_booking_fee(jsonb), public.app_set_booking_fee(jsonb)
  to service_role;
grant execute on function public.app_get_booking_fee(jsonb) to anon;

create or replace function public.app_start_booking(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_course text := nullif(payload->>'courseId', '');
  v_dual text := nullif(payload->>'dualCourseId', '');
  v_plan text := nullif(payload->>'planId', '');
  v_mode text := coalesce(nullif(payload->>'mode', ''), 'booking');
  v_item text;
  v_plan_name text;
  v_deposit numeric;
  v_instalments integer;
  v_instalment_amount numeric;
  v_amount numeric;
  v_id uuid;
begin
  if v_mode not in ('booking', 'due_now') then
    return jsonb_build_object('ok', false, 'error', 'Unknown payment type.');
  end if;

  if v_course is not null then
    select c.name, p.name, p.deposit, p.instalments, p.instalment_amount
      into v_item, v_plan_name, v_deposit, v_instalments, v_instalment_amount
    from public.courses c
    left join public.course_payment_plans l
      on l.course_id = c.id and l.plan_id = v_plan::uuid
    left join public.payment_plans p on p.id = l.plan_id
    where c.id = v_course and c.is_active;
  else
    select d.title, p.name, p.deposit, p.instalments, p.instalment_amount
      into v_item, v_plan_name, v_deposit, v_instalments, v_instalment_amount
    from public.dual_courses d
    left join public.dual_payment_plans l
      on l.dual_id = d.id and l.plan_id = v_plan::uuid
    left join public.payment_plans p on p.id = l.plan_id
    where d.id = v_dual and d.is_active;
  end if;

  if v_item is null or (v_plan is not null and v_plan_name is null) then
    return jsonb_build_object('ok', false, 'error', 'That course or payment plan isn''t available.');
  end if;

  if v_mode = 'due_now' then
    if v_plan is null then
      return jsonb_build_object('ok', false, 'error', 'Choose a payment plan first.');
    end if;
    v_amount := case when v_instalments > 1 then v_deposit else v_instalment_amount end;
  else
    select coalesce((select value::numeric from public.app_settings where key = 'booking_fee'), 500)
      into v_amount;
  end if;

  insert into public.deposit_payments
    (course_id, dual_course_id, plan_id, item_name, plan_name, amount,
     full_name, email, phone, payment_kind)
  values (
    v_course, v_dual, v_plan::uuid, v_item, v_plan_name,
    v_amount,
    payload->>'fullName', lower(payload->>'email'), payload->>'phone', v_mode
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'id', v_id::text, 'item', v_item, 'plan', v_plan_name,
    'amount', v_amount, 'mode', v_mode);
end;
$$;