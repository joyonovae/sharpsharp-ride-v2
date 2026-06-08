create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create unique index if not exists ride_bookings_payment_reference_key
  on public.ride_bookings (payment_reference);

create or replace function public.complete_paid_ride_booking(
  p_ride_id uuid,
  p_user_id uuid,
  p_full_name text,
  p_phone text,
  p_seats integer,
  p_total_amount numeric,
  p_payment_reference text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.rides%rowtype;
  v_booking public.ride_bookings%rowtype;
  v_expected_amount numeric;
begin
  if p_seats < 1 then
    raise exception 'Seats must be at least one';
  end if;

  select *
  into v_booking
  from public.ride_bookings
  where payment_reference = p_payment_reference;

  if found then
    return jsonb_build_object(
      'id', v_booking.id,
      'ride_id', v_booking.ride_id,
      'seats_booked', v_booking.seats_booked
    );
  end if;

  select *
  into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if v_ride.available_seats < p_seats then
    raise exception 'Only % seat(s) available', v_ride.available_seats;
  end if;

  v_expected_amount := v_ride.price_per_seat * p_seats;

  if v_expected_amount <> p_total_amount then
    raise exception 'Booking amount does not match ride price';
  end if;

  insert into public.ride_bookings (
    ride_id,
    user_id,
    full_name,
    phone,
    seats_booked,
    total_amount,
    booking_reference,
    payment_reference,
    payment_status
  )
  values (
    p_ride_id,
    p_user_id,
    p_full_name,
    p_phone,
    p_seats,
    p_total_amount,
    p_payment_reference,
    p_payment_reference,
    'paid'
  )
  returning * into v_booking;

  update public.rides
  set available_seats = available_seats - p_seats
  where id = p_ride_id;

  return jsonb_build_object(
    'id', v_booking.id,
    'ride_id', v_booking.ride_id,
    'seats_booked', v_booking.seats_booked
  );
end;
$$;

revoke all on function public.complete_paid_ride_booking(
  uuid, uuid, text, text, integer, numeric, text
) from public, anon, authenticated;
grant execute on function public.complete_paid_ride_booking(
  uuid, uuid, text, text, integer, numeric, text
) to service_role;

alter table public.profiles enable row level security;
alter table public.rides enable row level security;
alter table public.ride_bookings enable row level security;
alter table public.ride_requests enable row level security;
alter table public.driver_applications enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select to authenticated
using (id = auth.uid() or private.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

revoke update on public.profiles from authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

drop policy if exists "rides_public_read" on public.rides;
create policy "rides_public_read"
on public.rides for select to anon, authenticated
using (true);

drop policy if exists "approved_drivers_create_rides" on public.rides;
create policy "approved_drivers_create_rides"
on public.rides for insert to authenticated
with check (
  driver_id = auth.uid()
  and (
    private.is_admin()
    or exists (
      select 1
      from public.driver_applications
      where user_id = auth.uid()
        and status = 'approved'
    )
  )
);

drop policy if exists "admins_manage_rides" on public.rides;
create policy "admins_manage_rides"
on public.rides for all to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "users_read_own_bookings" on public.ride_bookings;
create policy "users_read_own_bookings"
on public.ride_bookings for select to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "users_manage_own_ride_requests" on public.ride_requests;
drop policy if exists "users_read_own_ride_requests" on public.ride_requests;
create policy "users_read_own_ride_requests"
on public.ride_requests for select to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "users_create_own_ride_requests" on public.ride_requests;
create policy "users_create_own_ride_requests"
on public.ride_requests for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "admins_manage_ride_requests" on public.ride_requests;
create policy "admins_manage_ride_requests"
on public.ride_requests for all to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "users_manage_own_driver_applications" on public.driver_applications;
drop policy if exists "users_read_own_driver_applications" on public.driver_applications;
create policy "users_read_own_driver_applications"
on public.driver_applications for select to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "users_create_own_driver_applications" on public.driver_applications;
create policy "users_create_own_driver_applications"
on public.driver_applications for insert to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "admins_manage_driver_applications" on public.driver_applications;
create policy "admins_manage_driver_applications"
on public.driver_applications for all to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "users_read_own_notifications" on public.notifications;
create policy "users_read_own_notifications"
on public.notifications for select to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "users_update_own_notifications" on public.notifications;
create policy "users_update_own_notifications"
on public.notifications for update to authenticated
using (user_id = auth.uid() or private.is_admin())
with check (user_id = auth.uid() or private.is_admin());

drop policy if exists "users_create_own_notifications" on public.notifications;
create policy "users_create_own_notifications"
on public.notifications for insert to authenticated
with check (user_id = auth.uid() or private.is_admin());
