alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_user_dedupe_key_unique
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null;

alter table public.ride_bookings
  add column if not exists ride_request_id uuid references public.ride_requests(id) on delete set null;

create unique index if not exists ride_bookings_ride_request_unique
  on public.ride_bookings (ride_request_id)
  where ride_request_id is not null;

create or replace function public.assign_ride_request_to_ride(
  p_request_id uuid,
  p_ride_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.ride_requests%rowtype;
  v_ride public.rides%rowtype;
begin
  select * into v_request
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Ride request not found';
  end if;

  if v_request.status in ('cancelled', 'completed') then
    raise exception 'This ride request can no longer be assigned';
  end if;

  if v_request.assigned_ride_id = p_ride_id and v_request.status = 'assigned' then
    return jsonb_build_object(
      'changed', false,
      'request_id', v_request.id,
      'ride_id', p_ride_id,
      'passenger_id', v_request.user_id,
      'passenger_name', v_request.full_name,
      'driver_id', v_request.assigned_driver_id,
      'driver_name', null,
      'from_city', v_request.from_city,
      'to_city', v_request.to_city,
      'travel_date', v_request.travel_date
    );
  end if;

  select * into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if coalesce(v_ride.available_seats, 0) < coalesce(v_request.passenger_count, 1) then
    raise exception 'The selected ride does not have enough available seats';
  end if;

  update public.ride_requests
  set
    assigned_ride_id = p_ride_id,
    assigned_driver_id = v_ride.driver_id,
    status = 'assigned',
    assigned_at = now(),
    admin_note = 'Ride assigned by admin.',
    updated_at = now()
  where id = p_request_id;

  return jsonb_build_object(
    'changed', true,
    'request_id', p_request_id,
    'ride_id', p_ride_id,
    'passenger_id', v_request.user_id,
    'passenger_name', v_request.full_name,
    'driver_id', v_ride.driver_id,
    'driver_name', v_ride.driver_name,
    'from_city', v_request.from_city,
    'to_city', v_request.to_city,
    'travel_date', v_request.travel_date
  );
end;
$$;

drop function if exists public.complete_paid_ride_booking(
  uuid,
  uuid,
  text,
  text,
  integer,
  numeric,
  text
);

create or replace function public.complete_paid_ride_booking(
  p_user_id uuid,
  p_ride_id uuid,
  p_full_name text,
  p_phone text,
  p_seats integer,
  p_total_amount numeric,
  p_payment_reference text,
  p_ride_request_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ride public.rides%rowtype;
  v_request public.ride_requests%rowtype;
  v_existing public.ride_bookings%rowtype;
  v_booking_id uuid;
  v_expected_amount numeric;
begin
  select * into v_existing
  from public.ride_bookings
  where payment_reference = p_payment_reference
  limit 1;

  if found then
    return jsonb_build_object(
      'changed', false,
      'booking_id', v_existing.id,
      'ride_id', v_existing.ride_id,
      'ride_request_id', v_existing.ride_request_id
    );
  end if;

  if p_seats < 1 then
    raise exception 'At least one seat is required';
  end if;

  if p_ride_request_id is not null then
    select * into v_request
    from public.ride_requests
    where id = p_ride_request_id
    for update;

    if not found then
      raise exception 'Assigned ride request not found';
    end if;

    if v_request.user_id is distinct from p_user_id then
      raise exception 'This ride request belongs to another user';
    end if;

    if v_request.assigned_ride_id is distinct from p_ride_id then
      raise exception 'This ride is not assigned to the request';
    end if;

    if v_request.status = 'completed' then
      select * into v_existing
      from public.ride_bookings
      where ride_request_id = p_ride_request_id
      limit 1;

      if found then
        return jsonb_build_object(
          'changed', false,
          'booking_id', v_existing.id,
          'ride_id', v_existing.ride_id,
          'ride_request_id', v_existing.ride_request_id
        );
      end if;

      raise exception 'This ride request has already been completed';
    end if;

    if v_request.status <> 'assigned' then
      raise exception 'This ride request is not ready for payment';
    end if;

    if p_seats <> coalesce(v_request.passenger_count, 1) then
      raise exception 'Seat count must match the assigned ride request';
    end if;
  end if;

  select * into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if coalesce(v_ride.available_seats, 0) < p_seats then
    raise exception 'Not enough seats are available';
  end if;

  v_expected_amount := coalesce(v_ride.price_per_seat, 0) * p_seats;

  if p_total_amount <> v_expected_amount then
    raise exception 'Payment amount does not match the ride total';
  end if;

  insert into public.ride_bookings (
    user_id,
    ride_id,
    ride_request_id,
    full_name,
    phone,
    seats_booked,
    total_amount,
    booking_reference,
    payment_reference,
    payment_status
  )
  values (
    p_user_id,
    p_ride_id,
    p_ride_request_id,
    p_full_name,
    p_phone,
    p_seats,
    p_total_amount,
    p_payment_reference,
    p_payment_reference,
    'paid'
  )
  returning id into v_booking_id;

  update public.rides
  set available_seats = available_seats - p_seats
  where id = p_ride_id;

  if p_ride_request_id is not null then
    update public.ride_requests
    set status = 'completed', updated_at = now()
    where id = p_ride_request_id;
  end if;

  return jsonb_build_object(
    'changed', true,
    'booking_id', v_booking_id,
    'ride_id', p_ride_id,
    'ride_request_id', p_ride_request_id,
    'driver_id', v_ride.driver_id,
    'seats', p_seats
  );
end;
$$;

revoke all on function public.assign_ride_request_to_ride(uuid, uuid) from public, anon, authenticated;
revoke all on function public.complete_paid_ride_booking(uuid, uuid, text, text, integer, numeric, text, uuid) from public, anon, authenticated;
grant execute on function public.assign_ride_request_to_ride(uuid, uuid) to service_role;
grant execute on function public.complete_paid_ride_booking(uuid, uuid, text, text, integer, numeric, text, uuid) to service_role;
