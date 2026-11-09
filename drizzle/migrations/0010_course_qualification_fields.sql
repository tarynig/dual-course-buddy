alter table public.courses add column if not exists nqf_level text, add column if not exists credits integer, add column if not exists accreditation text, add column if not exists course_code text;

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
          'nqfLevel', c.nqf_level,
          'credits', c.credits,
          'accreditation', c.accreditation,
          'courseCode', c.course_code,
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
      nqf_level = nullif(payload->>'nqfLevel', ''),
      credits = nullif(payload->>'credits', '')::int,
      accreditation = nullif(payload->>'accreditation', ''),
      course_code = nullif(payload->>'courseCode', ''),
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
    (id, faculty_id, name, months, type, award, saqa, nqf_level, credits, accreditation, course_code, description, details,
     certification, careers, outline, requirements, signature, image_url, sort_order)
  values (
    v_new, payload->>'facultyId', payload->>'name', (payload->>'months')::int,
    payload->>'type', payload->>'award', nullif(payload->>'saqa', ''),
    nullif(payload->>'nqfLevel', ''), nullif(payload->>'credits', '')::int,
    nullif(payload->>'accreditation', ''), nullif(payload->>'courseCode', ''),
    payload->>'description', nullif(payload->>'details', ''),
    nullif(payload->>'certification', ''), nullif(payload->>'careers', ''),
    nullif(payload->>'outline', ''), nullif(payload->>'requirements', ''),
    coalesce((payload->>'signature')::boolean, false), nullif(payload->>'imageUrl', ''),
    (select coalesce(max(sort_order), 0) + 1 from public.courses)
  );
  return jsonb_build_object('ok', true, 'id', v_new);
end;
$$;

update public.courses set
  nqf_level = 'Level ' || substring(award from ' · NQF (\d+)'),
  credits = substring(award from '(\d+) credits')::int,
  accreditation = substring(award from 'credits · (.+)$'),
  award = regexp_replace(award, ' · NQF.*$', '')
where award like '% · NQF %';

update public.courses set
  course_code = substring(award from '(CAC\d+)'),
  award = regexp_replace(award, ' · CAC\d+\)', ')'),
  accreditation = 'Creative Arts College'
where award ~ 'CAC\d+';