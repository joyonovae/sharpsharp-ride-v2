create table if not exists public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  owner_user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  phone text not null,
  email text,
  start_date date not null,
  end_date date not null,
  pickup_location text not null,
  return_location text not null,
  rental_days integer not null check (rental_days > 0),
  price_per_day numeric not null check (price_per_day > 0),
  total_amount numeric not null check (total_amount > 0),
  payment_reference text not null,
  payment_status text not null default 'paid' check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  booking_status text not null default 'confirmed' check (booking_status in ('pending', 'confirmed', 'completed', 'cancelled')),
  notes text,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date >= start_date)
);

create unique index if not exists rental_bookings_payment_reference_uidx
  on public.rental_bookings (payment_reference);
create index if not exists rental_bookings_user_idx
  on public.rental_bookings (user_id, created_at desc);
create index if not exists rental_bookings_owner_idx
  on public.rental_bookings (owner_user_id, created_at desc);
create index if not exists rental_bookings_vehicle_dates_idx
  on public.rental_bookings (vehicle_id, start_date, end_date);

alter table public.rental_bookings enable row level security;

drop policy if exists "users_read_own_rental_bookings" on public.rental_bookings;
create policy "users_read_own_rental_bookings"
on public.rental_bookings for select to authenticated
using (user_id = auth.uid() or owner_user_id = auth.uid() or private.is_admin());

drop policy if exists "admins_manage_rental_bookings" on public.rental_bookings;
create policy "admins_manage_rental_bookings"
on public.rental_bookings for all to authenticated
using (private.is_admin())
with check (private.is_admin());

create or replace function public.complete_paid_rental_booking(
  p_vehicle_id uuid,
  p_user_id uuid,
  p_full_name text,
  p_phone text,
  p_email text,
  p_start_date date,
  p_end_date date,
  p_pickup_location text,
  p_return_location text,
  p_rental_days integer,
  p_total_amount numeric,
  p_payment_reference text,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_vehicle public.vehicles%rowtype;
  v_owner_user_id uuid;
  v_existing public.rental_bookings%rowtype;
  v_booking public.rental_bookings%rowtype;
  v_expected_days integer;
  v_expected_total numeric;
begin
  select * into v_existing
  from public.rental_bookings
  where payment_reference = p_payment_reference;

  if found then
    return jsonb_build_object(
      'changed', false,
      'booking_id', v_existing.id,
      'vehicle_id', v_existing.vehicle_id
    );
  end if;

  perform pg_advisory_xact_lock(hashtext(p_vehicle_id::text));

  select * into v_vehicle
  from public.vehicles
  where id = p_vehicle_id
    and coalesce(is_available, true) = true;

  if not found then raise exception 'Rental vehicle is not available'; end if;

  v_expected_days := (p_end_date - p_start_date) + 1;
  if p_start_date < current_date or v_expected_days < 1 or p_rental_days <> v_expected_days then
    raise exception 'Invalid rental dates';
  end if;

  v_expected_total := v_expected_days * v_vehicle.price_per_day;
  if p_total_amount <> v_expected_total then raise exception 'Rental amount mismatch'; end if;

  if exists (
    select 1 from public.rental_bookings
    where vehicle_id = p_vehicle_id
      and payment_status = 'paid'
      and booking_status in ('confirmed', 'completed')
      and daterange(start_date, end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'Vehicle is already booked for these dates';
  end if;

  select user_id into v_owner_user_id
  from public.rental_vehicle_applications
  where published_vehicle_id = p_vehicle_id and status = 'approved'
  order by reviewed_at desc nulls last
  limit 1;

  insert into public.rental_bookings (
    user_id, vehicle_id, owner_user_id, full_name, phone, email,
    start_date, end_date, pickup_location, return_location, rental_days,
    price_per_day, total_amount, payment_reference, payment_status,
    booking_status, notes
  ) values (
    p_user_id, p_vehicle_id, v_owner_user_id, p_full_name, p_phone, p_email,
    p_start_date, p_end_date, p_pickup_location, p_return_location, v_expected_days,
    v_vehicle.price_per_day, v_expected_total, p_payment_reference, 'paid',
    'confirmed', p_notes
  )
  returning * into v_booking;

  return jsonb_build_object(
    'changed', true,
    'booking_id', v_booking.id,
    'vehicle_id', v_booking.vehicle_id
  );
exception
  when unique_violation then
    select * into v_existing from public.rental_bookings where payment_reference = p_payment_reference;
    return jsonb_build_object('changed', false, 'booking_id', v_existing.id, 'vehicle_id', v_existing.vehicle_id);
end;
$$;

revoke all on function public.complete_paid_rental_booking(uuid, uuid, text, text, text, date, date, text, text, integer, numeric, text, text) from public, anon, authenticated;
grant execute on function public.complete_paid_rental_booking(uuid, uuid, text, text, text, date, date, text, text, integer, numeric, text, text) to service_role;
