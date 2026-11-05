-- Publica uma submissao do onboarding nas tabelas definitivas do SaaS.
-- Requer que as tabelas principais e availability_breaks ja existam.
--
-- Uso:
-- select public.publish_onboarding_submission('SUBMISSION_ID_AQUI'::uuid, 'OWNER_USER_ID_AQUI'::uuid);

create or replace function public.publish_onboarding_submission(
  target_submission_id uuid,
  target_owner_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  submission_record public.onboarding_submissions%rowtype;
  payload jsonb;
  new_business_id uuid;
  main_location_id uuid;
  parsed_price numeric;
  service_item jsonb;
  professional_item jsonb;
  rule_item jsonb;
  break_item jsonb;
begin
  select *
  into submission_record
  from public.onboarding_submissions
  where id = target_submission_id;

  if not found then
    raise exception 'Onboarding submission % not found', target_submission_id;
  end if;

  payload := submission_record.payload;

  insert into public.businesses (
    owner_id,
    name,
    slug,
    segment,
    description,
    phone,
    whatsapp,
    email,
    status
  )
  values (
    target_owner_id,
    coalesce(payload #>> '{businesses,name}', submission_record.business_name),
    coalesce(payload #>> '{businesses,slug}', submission_record.slug),
    coalesce(payload #>> '{businesses,segment}', submission_record.segment, 'servicos'),
    payload #>> '{businesses,description}',
    payload #>> '{businesses,phone}',
    coalesce(payload #>> '{businesses,whatsapp}', submission_record.whatsapp),
    coalesce(payload #>> '{businesses,email}', submission_record.email),
    'active'
  )
  on conflict (slug) do update
  set
    owner_id = excluded.owner_id,
    name = excluded.name,
    segment = excluded.segment,
    description = excluded.description,
    phone = excluded.phone,
    whatsapp = excluded.whatsapp,
    email = excluded.email,
    status = excluded.status,
    updated_at = now()
  returning id into new_business_id;

  insert into public.business_branding (
    business_id,
    primary_color,
    hero_title,
    hero_subtitle,
    hero_image_url
  )
  values (
    new_business_id,
    coalesce(payload #>> '{business_branding,primary_color}', '#1c8dff'),
    payload #>> '{business_branding,hero_title}',
    payload #>> '{business_branding,hero_subtitle}',
    coalesce(submission_record.hero_image_url, payload #>> '{business_branding,hero_image_url}')
  )
  on conflict (business_id) do update
  set
    primary_color = excluded.primary_color,
    hero_title = excluded.hero_title,
    hero_subtitle = excluded.hero_subtitle,
    hero_image_url = excluded.hero_image_url,
    updated_at = now();

  insert into public.business_locations (
    business_id,
    name,
    address,
    is_main
  )
  values (
    new_business_id,
    coalesce(payload #>> '{business_locations,name}', 'Unidade principal'),
    payload #>> '{business_locations,address}',
    true
  )
  on conflict do nothing
  returning id into main_location_id;

  if main_location_id is null then
    select id
    into main_location_id
    from public.business_locations
    where business_id = new_business_id
    order by is_main desc, created_at asc
    limit 1;
  end if;

  delete from public.professional_services where business_id = new_business_id;
  delete from public.availability_breaks where business_id = new_business_id;
  delete from public.availability_rules where business_id = new_business_id;
  delete from public.professionals where business_id = new_business_id;
  delete from public.services where business_id = new_business_id;

  for service_item in
    select value from jsonb_array_elements(coalesce(payload -> 'services', '[]'::jsonb))
  loop
    parsed_price := null;

    if nullif(service_item ->> 'price', '') is not null then
      parsed_price := replace(replace(service_item ->> 'price', '.', ''), ',', '.')::numeric;
    end if;

    insert into public.services (
      business_id,
      name,
      description,
      duration_minutes,
      price,
      image_url,
      is_active,
      sort_order
    )
    values (
      new_business_id,
      service_item ->> 'name',
      service_item ->> 'description',
      coalesce(nullif(service_item ->> 'duration', '')::integer, 30),
      parsed_price,
      service_item ->> 'image_url',
      true,
      0
    );
  end loop;

  for professional_item in
    select value from jsonb_array_elements(coalesce(payload -> 'professionals', '[]'::jsonb))
  loop
    insert into public.professionals (
      business_id,
      name,
      specialty,
      is_active,
      sort_order
    )
    values (
      new_business_id,
      professional_item ->> 'name',
      professional_item ->> 'specialty',
      true,
      0
    );
  end loop;

  insert into public.professional_services (
    business_id,
    professional_id,
    service_id,
    is_active
  )
  select
    new_business_id,
    p.id,
    s.id,
    true
  from public.professionals p
  cross join public.services s
  where p.business_id = new_business_id
    and s.business_id = new_business_id;

  for rule_item in
    select value from jsonb_array_elements(coalesce(payload -> 'availability_rules', '[]'::jsonb))
  loop
    insert into public.availability_rules (
      business_id,
      professional_id,
      weekday,
      start_time,
      end_time,
      interval_minutes,
      is_active
    )
    select
      new_business_id,
      p.id,
      (rule_item ->> 'weekday')::integer,
      (rule_item ->> 'start_time')::time,
      (rule_item ->> 'end_time')::time,
      coalesce((rule_item ->> 'interval_minutes')::integer, 30),
      true
    from public.professionals p
    where p.business_id = new_business_id;
  end loop;

  for break_item in
    select value from jsonb_array_elements(coalesce(payload -> 'availability_breaks', '[]'::jsonb))
  loop
    insert into public.availability_breaks (
      business_id,
      professional_id,
      weekday,
      start_time,
      end_time,
      reason,
      is_active
    )
    select
      new_business_id,
      p.id,
      (break_item ->> 'weekday')::integer,
      (break_item ->> 'start_time')::time,
      (break_item ->> 'end_time')::time,
      break_item ->> 'reason',
      true
    from public.professionals p
    where p.business_id = new_business_id;
  end loop;

  insert into public.business_settings (
    business_id,
    timezone,
    currency,
    appointment_confirmation_required,
    allow_public_booking,
    metadata
  )
  values (
    new_business_id,
    'America/Sao_Paulo',
    'BRL',
    true,
    true,
    jsonb_build_object(
      'socials',
      jsonb_strip_nulls(jsonb_build_object(
        'instagram_url', payload #>> '{businesses,instagram_url}',
        'tiktok_url', payload #>> '{businesses,tiktok_url}',
        'linkedin_url', payload #>> '{businesses,linkedin_url}',
        'facebook_url', payload #>> '{businesses,facebook_url}',
        'youtube_url', payload #>> '{businesses,youtube_url}',
        'website_url', payload #>> '{businesses,website_url}'
      ))
    )
  )
  on conflict (business_id) do update
  set
    timezone = excluded.timezone,
    currency = excluded.currency,
    appointment_confirmation_required = excluded.appointment_confirmation_required,
    allow_public_booking = excluded.allow_public_booking,
    metadata = jsonb_set(
      coalesce(public.business_settings.metadata, '{}'::jsonb),
      '{socials}',
      coalesce(excluded.metadata -> 'socials', '{}'::jsonb),
      true
    ),
    updated_at = now();

  update public.onboarding_submissions
  set
    status = 'published',
    updated_at = now()
  where id = target_submission_id;

  return new_business_id;
end;
$$;

grant execute on function public.publish_onboarding_submission(uuid, uuid) to authenticated;
