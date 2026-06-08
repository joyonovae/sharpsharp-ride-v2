alter table public.ride_bookings
  add column if not exists trip_status text not null default 'booked',
  add column if not exists completed_at timestamptz,
  add column if not exists completed_by uuid references public.profiles(id) on delete set null;

alter table public.ride_bookings
  drop constraint if exists ride_bookings_trip_status_check;

alter table public.ride_bookings
  add constraint ride_bookings_trip_status_check
  check (trip_status in ('booked', 'completed'));

create index if not exists ride_bookings_trip_status_idx
  on public.ride_bookings (trip_status, ride_id);
