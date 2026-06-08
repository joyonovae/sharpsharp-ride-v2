drop policy if exists "drivers_read_bookings_for_own_rides" on public.ride_bookings;
create policy "drivers_read_bookings_for_own_rides"
on public.ride_bookings for select to authenticated
using (
  user_id = auth.uid()
  or private.is_admin()
  or exists (
    select 1
    from public.rides
    where rides.id = ride_bookings.ride_id
      and rides.driver_id = auth.uid()
  )
);

drop policy if exists "drivers_read_assigned_requests" on public.ride_requests;
create policy "drivers_read_assigned_requests"
on public.ride_requests for select to authenticated
using (
  user_id = auth.uid()
  or assigned_driver_id = auth.uid()
  or private.is_admin()
);

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
  select *
  into v_request
  from public.ride_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Ride request not found';
  end if;

  if v_request.status = 'assigned' then
    if v_request.assigned_ride_id = p_ride_id then
      return jsonb_build_object(
        'changed', false,
        'request_id', v_request.id,
        'ride_id', v_request.assigned_ride_id,
        'passenger_id', v_request.user_id,
        'passenger_name', v_request.full_name,
        'driver_id', v_request.assigned_driver_id,
        'driver_name', null,
        'from_city', v_request.from_city,
        'to_city', v_request.to_city,
        'travel_date', v_request.travel_date
      );
    end if;

    raise exception 'Ride request is already assigned';
  end if;

  select *
  into v_ride
  from public.rides
  where id = p_ride_id
  for update;

  if not found then
    raise exception 'Ride not found';
  end if;

  if v_ride.available_seats < v_request.passenger_count then
    raise exception 'Not enough available seats';
  end if;

  update public.ride_requests
  set
    status = 'assigned',
    assigned_ride_id = v_ride.id,
    assigned_driver_id = v_ride.driver_id,
    assigned_at = now(),
    admin_note = 'Ride assigned by admin.',
    updated_at = now()
  where id = v_request.id;

  update public.rides
  set available_seats = available_seats - v_request.passenger_count
  where id = v_ride.id;

  return jsonb_build_object(
    'changed', true,
    'request_id', v_request.id,
    'ride_id', v_ride.id,
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

revoke all on function public.assign_ride_request_to_ride(uuid, uuid)
from public, anon, authenticated;
grant execute on function public.assign_ride_request_to_ride(uuid, uuid)
to service_role;
