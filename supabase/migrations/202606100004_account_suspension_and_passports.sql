alter table public.profiles add column if not exists account_status text not null default 'active';
alter table public.profiles add column if not exists suspension_reason text;
alter table public.profiles add column if not exists suspended_at timestamptz;
alter table public.profiles add column if not exists suspended_by uuid references auth.users(id) on delete set null;
alter table public.profiles add column if not exists reinstated_at timestamptz;

do $$ begin
  alter table public.profiles add constraint profiles_account_status_check
    check (account_status in ('active', 'suspended', 'blocked'));
exception when duplicate_object then null; end $$;

create table if not exists public.suspension_review_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  explanation text not null,
  contact_phone text,
  supporting_note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists suspension_review_one_pending_uidx
  on public.suspension_review_requests(user_id) where status = 'pending';
alter table public.suspension_review_requests enable row level security;
drop policy if exists "users_read_own_suspension_reviews" on public.suspension_review_requests;
create policy "users_read_own_suspension_reviews" on public.suspension_review_requests for select to authenticated
using (user_id = auth.uid() or private.is_admin());
drop policy if exists "suspended_users_create_reviews" on public.suspension_review_requests;
create policy "suspended_users_create_reviews" on public.suspension_review_requests for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and account_status in ('suspended','blocked')));
drop policy if exists "admins_manage_suspension_reviews" on public.suspension_review_requests;
create policy "admins_manage_suspension_reviews" on public.suspension_review_requests for all to authenticated
using (private.is_admin()) with check (private.is_admin());

insert into storage.buckets (id, name, public)
values ('driver-passports', 'driver-passports', false)
on conflict (id) do update set public = false;
drop policy if exists "drivers_upload_own_passports" on storage.objects;
create policy "drivers_upload_own_passports" on storage.objects for insert to authenticated
with check (bucket_id = 'driver-passports' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "approved_drivers_create_rides" on public.rides;
create policy "approved_drivers_create_rides" on public.rides for insert to authenticated
with check (
  driver_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active')
  and (private.is_admin() or exists (select 1 from public.driver_applications where user_id = auth.uid() and status = 'approved'))
);
drop policy if exists "users_create_own_ride_requests" on public.ride_requests;
create policy "users_create_own_ride_requests" on public.ride_requests for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active'));
drop policy if exists "users_create_own_driver_applications" on public.driver_applications;
create policy "users_create_own_driver_applications" on public.driver_applications for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active'));
drop policy if exists "owners_submit_rental_applications" on public.rental_vehicle_applications;
create policy "owners_submit_rental_applications" on public.rental_vehicle_applications for insert to authenticated
with check (user_id = auth.uid() and status = 'pending' and exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active'));
drop policy if exists "eligible_users_create_reviews" on public.ride_reviews;
create policy "eligible_users_create_reviews" on public.ride_reviews for insert to authenticated
with check (
 reviewer_id = auth.uid() and status = 'published'
 and exists (select 1 from public.profiles where id = auth.uid() and account_status = 'active')
 and exists (
  select 1 from public.ride_bookings booking join public.rides ride on ride.id = booking.ride_id
  where booking.id = booking_id and booking.ride_id = ride_id and booking.payment_status = 'paid' and booking.trip_status = 'completed'
  and ((context = 'driver' and booking.user_id = auth.uid() and reviewee_id = ride.driver_id)
    or (context = 'passenger' and ride.driver_id = auth.uid() and reviewee_id = booking.user_id))
 )
);
