-- Creative Arts College — data operations as SQL functions.
--
-- Every data operation the site performs lives here as a function taking one
-- jsonb payload and returning one jsonb result. That keeps the application code
-- free of query text, so the same code can reach the database over either of two
-- transports (see src/lib/data.server.ts):
--   * Lovable's own hosting   -> Data API call (no direct database socket there)
--   * the college's own host  -> plain SQL over DATABASE_URL
--
-- Functions are SECURITY DEFINER so they run with the rights of their owner and
-- are not affected by row level security. They are revoked from PUBLIC and only
-- granted to the roles the site actually uses.
--
-- Safe to re-run: everything is CREATE OR REPLACE.

-- --------------------------------------------------------------- shared helper --

-- Timestamps as text the browser can turn back into a date.
create or replace function public.app_iso(ts timestamptz)
returns text
language sql immutable
as $$
  select replace(to_char(ts at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS'), ' ', 'T') || 'Z';
$$;

-- ---------------------------------------------------------------- catalogue --

-- Everything the public site needs to show in one call.
create or replace function public.app_get_catalogue(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select jsonb_build_object(
    'faculties', (
      select coalesce(
        jsonb_agg(jsonb_build_object('id', f.id, 'name', f.name, 'tagline', f.tagline)
                  order by f.sort_order),
        '[]'::jsonb)
      from public.faculties f
    ),
    'plans', (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'id', p.id::text,
          'name', p.name,
          'deposit', p.deposit,
          'instalments', p.instalments,
          'instalmentAmount', p.instalment_amount,
          'notes', p.notes
        ) order by p.sort_order, p.created_at),
        '[]'::jsonb)
      from public.payment_plans p
    ),
    'courses', (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'id', c.id,
          'facultyId', c.faculty_id,
          'name', c.name,
          'months', c.months,
          'type', c.type,
          'award', c.award,
          'saqa', c.saqa,
          'description', c.description,
          'signature', c.signature,
          'details', c.details,
          'certification', c.certification,
          'careers', c.careers,
          'outline', c.outline,
          'requirements', c.requirements,
          'imageUrl', c.image_url,
          'planIds', (
            select coalesce(
              jsonb_agg(l.plan_id::text order by l.plan_id),
              '[]'::jsonb)
            from public.course_payment_plans l
            where l.course_id = c.id
          )
        ) order by c.sort_order),
        '[]'::jsonb)
      from public.courses c
      where c.is_active
    ),
    'duals', (
      select coalesce(
        jsonb_agg(jsonb_build_object(
          'id', d.id,
          'title', d.title,
          'facultyId', d.faculty_id,
          'months', d.months,
          'saving', d.saving,
          'courseIds', (
            select coalesce(
              jsonb_agg(i.course_id order by i.position),
              '[]'::jsonb)
            from public.dual_course_courses i
            where i.dual_id = d.id
          ),
          'planIds', (
            select coalesce(
              jsonb_agg(l.plan_id::text order by l.plan_id),
              '[]'::jsonb)
            from public.dual_payment_plans l
            where l.dual_id = d.id
          )
        ) order by d.sort_order),
        '[]'::jsonb)
      from public.dual_courses d
      where d.is_active
        and not exists (
          select 1
          from public.dual_course_courses i
          join public.courses c on c.id = i.course_id
          where i.dual_id = d.id and not c.is_active
        )
    )
  );
$$;

-- ----------------------------------------------------------------- enquiries --

-- Saves an enquiry and names the course or dual it was about.
create or replace function public.app_add_enquiry(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_course text;
  v_dual text;
begin
  insert into public.enquiries
    (full_name, phone, email, course_id, dual_course_id, campus, message)
  values (
    payload->>'fullName', payload->>'phone', payload->>'email',
    nullif(payload->>'courseId', ''), nullif(payload->>'dualCourseId', ''),
    payload->>'campus', nullif(payload->>'message', '')
  )
  returning id into v_id;

  select name into v_course from public.courses where id = nullif(payload->>'courseId', '');
  select title into v_dual from public.dual_courses where id = nullif(payload->>'dualCourseId', '');

  return jsonb_build_object(
    'id', v_id::text,
    'courseName', v_course,
    'dualName', v_dual
  );
end;
$$;

create or replace function public.app_list_enquiries(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', e.id::text,
      'fullName', e.full_name,
      'phone', e.phone,
      'email', e.email,
      'courseId', e.course_id,
      'dualCourseId', e.dual_course_id,
      'courseName', c.name,
      'dualName', d.title,
      'campus', e.campus,
      'message', e.message,
      'status', e.status,
      'createdAt', to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ) order by e.created_at desc),
    '[]'::jsonb)
  from public.enquiries e
  left join public.courses c on c.id = e.course_id
  left join public.dual_courses d on d.id = e.dual_course_id;
$$;

create or replace function public.app_set_enquiry_status(payload jsonb)
returns jsonb
language sql volatile security definer
set search_path = public
as $$
  update public.enquiries
  set status = payload->>'status'
  where id = (payload->>'id')::uuid
  returning jsonb_build_object('ok', true);
$$;

-- -------------------------------------------------------------- applications --

create or replace function public.app_add_application(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_item text;
  v_course text := nullif(payload->>'courseId', '');
  v_dual text := nullif(payload->>'dualCourseId', '');
  v_elsewhere boolean := nullif(payload->>'studiedElsewhere', '')::text = 'yes';
begin
  if v_course is not null then
    select name into v_item from public.courses where id = v_course;
  elsif v_dual is not null then
    select title into v_item from public.dual_courses where id = v_dual;
  end if;

  insert into public.applications (
    course_id, dual_course_id, item_name, first_name, last_name, id_number, date_of_birth,
    gender, home_language, location, email, cell, last_school, highest_grade, grade_year,
    current_grade, studied_elsewhere, institution_name, institution_qualification,
    institution_completed, payer_first_name, payer_last_name, payer_phone, payer_email,
    payer_id_number, payer_relationship, payer_address, payer_employment)
  values (
    case when v_item is not null then v_course end,
    case when v_item is not null then v_dual end,
    v_item,
    payload->>'firstName', payload->>'lastName', payload->>'idNumber',
    (payload->>'dateOfBirth')::date,
    payload->>'gender', payload->>'homeLanguage', payload->>'location',
    lower(payload->>'email'), payload->>'cell',
    nullif(payload->>'lastSchool', ''), nullif(payload->>'highestGrade', ''),
    nullif(payload->>'gradeYear', '')::int, nullif(payload->>'currentGrade', ''),
    case when v_elsewhere then (payload->>'institutionCompleted') = 'yes' else null end,
    case when v_elsewhere then nullif(payload->>'institutionQualification', '') end,
    case when v_elsewhere then (payload->>'institutionCompleted') = 'yes' else null end,
    payload->>'payerFirstName', payload->>'payerLastName', payload->>'payerPhone',
    lower(payload->>'payerEmail'), payload->>'payerIdNumber', payload->>'payerRelationship',
    payload->>'payerAddress', payload->>'payerEmployment'
  )
  returning id into v_id;

  return jsonb_build_object('id', v_id::text);
end;
$$;

create or replace function public.app_list_applications(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', a.id::text,
      'courseId', a.course_id,
      'dualCourseId', a.dual_course_id,
      'itemName', a.item_name,
      'firstName', a.first_name,
      'lastName', a.last_name,
      'idNumber', a.id_number,
      'dateOfBirth', a.date_of_birth::text,
      'gender', a.gender,
      'homeLanguage', a.home_language,
      'location', a.location,
      'email', a.email,
      'cell', a.cell,
      'lastSchool', a.last_school,
      'highestGrade', a.highest_grade,
      'gradeYear', a.grade_year,
      'currentGrade', a.current_grade,
      'studiedElsewhere', a.studied_elsewhere,
      'institutionName', a.institution_name,
      'institutionQualification', a.institution_qualification,
      'institutionCompleted', a.institution_completed,
      'payerFirstName', a.payer_first_name,
      'payerLastName', a.payer_last_name,
      'payerPhone', a.payer_phone,
      'payerEmail', a.payer_email,
      'payerIdNumber', a.payer_id_number,
      'payerRelationship', a.payer_relationship,
      'payerAddress', a.payer_address,
      'payerEmployment', a.payer_employment,
      'status', a.status,
      'createdAt', to_char(a.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ) order by a.created_at desc),
    '[]'::jsonb)
  from public.applications a
  limit 500;
$$;

create or replace function public.app_set_application_status(payload jsonb)
returns jsonb
language sql volatile security definer
set search_path = public
as $$
  update public.applications
  set status = payload->>'status'
  where id = (payload->>'id')::uuid
  returning jsonb_build_object('ok', true);
$$;

-- ------------------------------------------------------------- accounts & auth --

create or replace function public.app_sign_in(payload jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_build_object('id', u.id::text, 'email', u.email, 'role', u.role),
    'null'::jsonb)
  from public.app_users u
  where lower(u.email) = lower(payload->>'email')
    and u.is_active
    and public.verify_password(payload->>'password', u.password_hash)
  limit 1;
$$;

create or replace function public.app_add_session(payload jsonb)
returns jsonb
language sql volatile security definer
set search_path = public
as $$
  insert into public.app_sessions (user_id, token_hash, expires_at)
  values ((payload->>'userId')::uuid, payload->>'tokenHash', (payload->>'expiresAt')::timestamptz)
  returning jsonb_build_object('ok', true);
$$;

create or replace function public.app_read_session(payload jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_build_object('id', u.id::text, 'email', u.email, 'role', u.role),
    'null'::jsonb)
  from public.app_sessions s
  join public.app_users u on u.id = s.user_id
  where s.token_hash = payload->>'tokenHash'
    and s.expires_at > now()
    and u.is_active
  limit 1;
$$;

create or replace function public.app_delete_session(payload jsonb)
returns jsonb
language sql volatile security definer
set search_path = public
as $$
  delete from public.app_sessions
  where token_hash = payload->>'tokenHash'
  returning jsonb_build_object('ok', true);
$$;

create or replace function public.app_change_password(payload jsonb)
returns jsonb
language sql volatile security definer
set search_path = public
as $$
  update public.app_users
  set password_hash = public.hash_password(payload->>'newPassword'),
      updated_at = now()
  where id = (payload->>'userId')::uuid
    and public.verify_password(payload->>'currentPassword', password_hash)
  returning jsonb_build_object('ok', true);
$$;

create or replace function public.app_list_staff(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', u.id::text, 'email', u.email, 'role', u.role, 'isActive', u.is_active
    ) order by u.created_at),
    '[]'::jsonb)
  from public.app_users u;
$$;

create or replace function public.app_add_staff(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.app_users where lower(email) = lower(payload->>'email')) then
    return jsonb_build_object('ok', false, 'error', 'An account with that email already exists.');
  end if;

  insert into public.app_users (email, password_hash, role)
  values (
    payload->>'email',
    public.hash_password(payload->>'password'),
    case when payload->>'role' = 'admin' then 'admin' else 'staff' end
  );
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.app_reset_staff_password(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_found boolean;
begin
  update public.app_users
  set password_hash = public.hash_password(payload->>'password'),
      updated_at = now()
  where id = (payload->>'id')::uuid
  returning true into v_found;

  if not coalesce(v_found, false) then
    return jsonb_build_object('ok', false, 'error', 'Account not found.');
  end if;

  -- Sign the person out everywhere so the old password stops working at once.
  delete from public.app_sessions where user_id = (payload->>'id')::uuid;
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.app_set_staff_active(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_active boolean := (payload->>'active')::boolean;
  v_id uuid := (payload->>'id')::uuid;
begin
  if v_id = (payload->>'actorId')::uuid and not v_active then
    return jsonb_build_object('ok', false, 'error', 'You can''t switch off your own account.');
  end if;

  update public.app_users
  set is_active = v_active, updated_at = now()
  where id = v_id;

  if not v_active then
    delete from public.app_sessions where user_id = v_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- -------------------------------------------------------------- course content --

-- Turns a name into a web address fragment, e.g. "Sound Engineering" -> "sound-engineering".
create or replace function public.app_slug(input text)
returns text
language sql immutable
as $$
  select coalesce(
    nullif(
      btrim(regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'), '-'),
      'item');
$$;

create or replace function public.app_save_course(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_id text := nullif(payload->>'id', '');
  v_base text;
  v_new text;
  v_n int := 2;
begin
  if v_id is not null then
    update public.courses set
      faculty_id = payload->>'facultyId',
      name = payload->>'name',
      months = (payload->>'months')::int,
      type = payload->>'type',
      award = payload->>'award',
      saqa = nullif(payload->>'saqa', ''),
      description = payload->>'description',
      details = nullif(payload->>'details', ''),
      certification = nullif(payload->>'certification', ''),
      careers = nullif(payload->>'careers', ''),
      outline = nullif(payload->>'outline', ''),
      requirements = nullif(payload->>'requirements', ''),
      signature = coalesce((payload->>'signature')::boolean, false),
      image_url = nullif(payload->>'imageUrl', '')
    where id = v_id;
    return jsonb_build_object('ok', true, 'id', v_id);
  end if;

  v_base := public.app_slug(payload->>'name');
  v_new := v_base;
  while exists (select 1 from public.courses where id = v_new) loop
    v_new := v_base || '-' || v_n::text;
    v_n := v_n + 1;
  end loop;

  insert into public.courses
    (id, faculty_id, name, months, type, award, saqa, description, details,
     certification, careers, outline, requirements, signature, image_url, sort_order)
  values (
    v_new, payload->>'facultyId', payload->>'name', (payload->>'months')::int,
    payload->>'type', payload->>'award', nullif(payload->>'saqa', ''),
    payload->>'description', nullif(payload->>'details', ''),
    nullif(payload->>'certification', ''), nullif(payload->>'careers', ''),
    nullif(payload->>'outline', ''), nullif(payload->>'requirements', ''),
    coalesce((payload->>'signature')::boolean, false), nullif(payload->>'imageUrl', ''),
    (select coalesce(max(sort_order), 0) + 1 from public.courses)
  );
  return jsonb_build_object('ok', true, 'id', v_new);
end;
$$;

create or replace function public.app_delete_course(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_duals int;
  v_enquiries int;
begin
  select count(*) into v_duals from public.dual_course_courses where course_id = payload->>'id';
  if v_duals > 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'This course is part of a dual course. Remove it from those first.');
  end if;

  select count(*) into v_enquiries from public.enquiries where course_id = payload->>'id';
  if v_enquiries > 0 then
    return jsonb_build_object(
      'ok', false,
      'error', 'Students have enquired about this course, so it can''t be deleted.');
  end if;

  delete from public.courses where id = payload->>'id';
  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.app_save_dual(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_id text := nullif(payload->>'id', '');
  v_first text := payload->'courseIds'->>0;
  v_second text := payload->'courseIds'->>1;
  v_new text;
begin
  if v_first = v_second then
    return jsonb_build_object('ok', false, 'error', 'Pick two different courses.');
  end if;

  if v_id is null then
    v_new := 'dual-' || public.app_slug(v_first || '-' || v_second);
    if exists (select 1 from public.dual_courses where id = v_new) then
      return jsonb_build_object('ok', false, 'error', 'That combination already exists.');
    end if;
    v_id := v_new;
    insert into public.dual_courses (id, title, faculty_id, months, sort_order)
    values (
      v_id, payload->>'title', payload->>'facultyId', (payload->>'months')::int,
      (select coalesce(max(sort_order), 0) + 1 from public.dual_courses)
    );
  else
    update public.dual_courses
    set title = payload->>'title',
        faculty_id = payload->>'facultyId',
        months = (payload->>'months')::int
    where id = v_id;
  end if;

  delete from public.dual_course_courses where dual_id = v_id;
  insert into public.dual_course_courses (dual_id, course_id, position)
  values (v_id, v_first, 1), (v_id, v_second, 2);

  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.app_delete_dual(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.enquiries where dual_course_id = payload->>'id') then
    return jsonb_build_object(
      'ok', false,
      'error', 'Students have enquired about this dual course, so it can''t be deleted.');
  end if;

  delete from public.dual_course_courses where dual_id = payload->>'id';
  delete from public.dual_courses where id = payload->>'id';
  return jsonb_build_object('ok', true);
end;
$$;

-- ------------------------------------------------------------- payment plans --

create or replace function public.app_save_plan(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_id text := nullif(payload->>'id', '');
  v_notes text := nullif(payload->>'notes', '');
begin
  if v_id is not null then
    update public.payment_plans set
      name = payload->>'name',
      deposit = (payload->>'deposit')::numeric,
      instalments = (payload->>'instalments')::int,
      instalment_amount = (payload->>'instalmentAmount')::numeric,
      notes = v_notes
    where id = v_id::uuid;
    return jsonb_build_object('ok', true, 'id', v_id);
  end if;

  insert into public.payment_plans (name, deposit, instalments, instalment_amount, notes, sort_order)
  values (
    payload->>'name', (payload->>'deposit')::numeric, (payload->>'instalments')::int,
    (payload->>'instalmentAmount')::numeric, v_notes,
    (select coalesce(max(sort_order), 0) + 1 from public.payment_plans)
  )
  returning id::text into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end;
$$;

create or replace function public.app_delete_plan(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
begin
  delete from public.payment_plans where id = (payload->>'id')::uuid;
  return jsonb_build_object('ok', true);
end;
$$;

-- Which plans a course or dual course offers, and for duals the saving.
create or replace function public.app_set_item_plans(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_kind text := payload->>'kind';
  v_id text := payload->>'id';
  v_plan jsonb;
begin
  if v_kind = 'course' then
    delete from public.course_payment_plans where course_id = v_id;
    for v_plan in select * from jsonb_array_elements(payload->'planIds') loop
      insert into public.course_payment_plans (course_id, plan_id)
      values (v_id, (v_plan #>> '{}')::uuid);
    end loop;
  else
    delete from public.dual_payment_plans where dual_id = v_id;
    for v_plan in select * from jsonb_array_elements(payload->'planIds') loop
      insert into public.dual_payment_plans (dual_id, plan_id)
      values (v_id, (v_plan #>> '{}')::uuid);
    end loop;
    update public.dual_courses
    set saving = case when payload ? 'saving' and payload->>'saving' is not null
                      then (payload->>'saving')::numeric else null end
    where id = v_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

-- ---------------------------------------------------------------- payments --

-- Records the booking fee the student is about to pay, and confirms the course
-- and plan they named really exist. The amount is never taken from the browser.
create or replace function public.app_start_booking(payload jsonb)
returns jsonb
language plpgsql volatile security definer
set search_path = public
as $$
declare
  v_course text := nullif(payload->>'courseId', '');
  v_dual text := nullif(payload->>'dualCourseId', '');
  v_plan text := nullif(payload->>'planId', '');
  v_item text;
  v_plan_name text;
  v_id uuid;
begin
  if v_course is not null then
    select c.name, p.name into v_item, v_plan_name
    from public.courses c
    left join public.course_payment_plans l
      on l.course_id = c.id and l.plan_id = v_plan::uuid
    left join public.payment_plans p on p.id = l.plan_id
    where c.id = v_course and c.is_active;
  else
    select d.title, p.name into v_item, v_plan_name
    from public.dual_courses d
    left join public.dual_payment_plans l
      on l.dual_id = d.id and l.plan_id = v_plan::uuid
    left join public.payment_plans p on p.id = l.plan_id
    where d.id = v_dual and d.is_active;
  end if;

  if v_item is null or (v_plan is not null and v_plan_name is null) then
    return jsonb_build_object('ok', false, 'error', 'That course or payment plan isn''t available.');
  end if;

  insert into public.deposit_payments
    (course_id, dual_course_id, plan_id, item_name, plan_name, amount,
     full_name, email, phone, payment_kind)
  values (
    v_course, v_dual, v_plan::uuid, v_item, v_plan_name,
    (payload->>'amount')::numeric,
    payload->>'fullName', lower(payload->>'email'), payload->>'phone', 'booking'
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'id', v_id::text, 'item', v_item, 'plan', v_plan_name);
end;
$$;

create or replace function public.app_list_payments(payload jsonb default '{}'::jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(jsonb_build_object(
      'id', p.id::text,
      'itemName', p.item_name,
      'planName', p.plan_name,
      'amount', p.amount,
      'fullName', p.full_name,
      'email', p.email,
      'phone', p.phone,
      'status', p.status,
      'createdAt', to_char(p.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'paidAt', case when p.paid_at is null then null
                     else to_char(p.paid_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') end,
      'paymentKind', p.payment_kind
    ) order by p.created_at desc),
    '[]'::jsonb)
  from public.deposit_payments p
  limit 300;
$$;

-- The payment a PayFast notification is about.
create or replace function public.app_payment_record(payload jsonb)
returns jsonb
language sql stable security definer
set search_path = public
as $$
  select coalesce(
    jsonb_build_object(
      'amount', p.amount,
      'status', p.status,
      'itemName', p.item_name,
      'fullName', p.full_name,
      'email', p.email,
      'phone', p.phone,
      'planName', p.plan_name,
      'paymentKind', p.payment_kind
    ),
    'null'::jsonb)
  from public.deposit_payments p
  where p.id = (payload->>'id')::uuid
  limit 1;
$$;

create or replace function public.app_apply_payment_result(payload jsonb)
returns jsonb
language sql volatile security definer
set search_path = public
as $$
  update public.deposit_payments
  set status = payload->>'status',
      provider_ref = nullif(payload->>'providerRef', ''),
      amount_paid = nullif(payload->>'amountPaid', '')::numeric,
      paid_at = nullif(payload->>'paidAt', '')::timestamptz
  where id = (payload->>'id')::uuid
  returning jsonb_build_object('ok', true);
$$;

-- ------------------------------------------------------------------- grants --
-- Only the roles the site itself uses may run these. Nothing is reachable from
-- the browser: public pages go through the catalogue function alone.

revoke all on function
  public.app_get_catalogue(jsonb), public.app_add_enquiry(jsonb),
  public.app_list_enquiries(jsonb), public.app_set_enquiry_status(jsonb),
  public.app_add_application(jsonb), public.app_list_applications(jsonb),
  public.app_set_application_status(jsonb),
  public.app_sign_in(jsonb), public.app_add_session(jsonb),
  public.app_read_session(jsonb), public.app_delete_session(jsonb),
  public.app_change_password(jsonb), public.app_list_staff(jsonb),
  public.app_add_staff(jsonb), public.app_reset_staff_password(jsonb),
  public.app_set_staff_active(jsonb),
  public.app_save_course(jsonb), public.app_delete_course(jsonb),
  public.app_save_dual(jsonb), public.app_delete_dual(jsonb),
  public.app_save_plan(jsonb), public.app_delete_plan(jsonb),
  public.app_set_item_plans(jsonb),
  public.app_start_booking(jsonb), public.app_list_payments(jsonb),
  public.app_payment_record(jsonb), public.app_apply_payment_result(jsonb)
from public, anon, authenticated;

grant execute on function
  public.app_get_catalogue(jsonb), public.app_add_enquiry(jsonb),
  public.app_list_enquiries(jsonb), public.app_set_enquiry_status(jsonb),
  public.app_add_application(jsonb), public.app_list_applications(jsonb),
  public.app_set_application_status(jsonb),
  public.app_sign_in(jsonb), public.app_add_session(jsonb),
  public.app_read_session(jsonb), public.app_delete_session(jsonb),
  public.app_change_password(jsonb), public.app_list_staff(jsonb),
  public.app_add_staff(jsonb), public.app_reset_staff_password(jsonb),
  public.app_set_staff_active(jsonb),
  public.app_save_course(jsonb), public.app_delete_course(jsonb),
  public.app_save_dual(jsonb), public.app_delete_dual(jsonb),
  public.app_save_plan(jsonb), public.app_delete_plan(jsonb),
  public.app_set_item_plans(jsonb),
  public.app_start_booking(jsonb), public.app_list_payments(jsonb),
  public.app_payment_record(jsonb), public.app_apply_payment_result(jsonb)
to service_role;

-- Public catalogue browsing is the one thing the site reads without a login.
grant execute on function public.app_get_catalogue(jsonb) to anon;
