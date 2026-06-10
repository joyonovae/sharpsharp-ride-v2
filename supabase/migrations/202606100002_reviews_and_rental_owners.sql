create table if not exists public.ride_reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.ride_bookings(id) on delete cascade,
  ride_id uuid not null references public.rides(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  reviewee_id uuid not null references public.profiles(id) on delete cascade,
  context text not null check (context in ('driver', 'passenger')),
  rating integer not null check (rating between 1 and 5),
  comment text,
  status text not null default 'published' check (status in ('published', 'hidden', 'flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, reviewer_id, context)
);

create index if not exists ride_reviews_reviewee_context_idx
  on public.ride_reviews (reviewee_id, context, status);

alter table public.ride_reviews enable row level security;

drop policy if exists "published_reviews_are_readable" on public.ride_reviews;
create policy "published_reviews_are_readable"
on public.ride_reviews for select
using (
  (status = 'published' and context = 'driver')
  or reviewer_id = auth.uid()
  or reviewee_id = auth.uid()
  or private.is_admin()
);

drop policy if exists "eligible_users_create_reviews" on public.ride_reviews;
create policy "eligible_users_create_reviews"
on public.ride_reviews for insert to authenticated
with check (
  reviewer_id = auth.uid()
  and status = 'published'
  and exists (
    select 1
    from public.ride_bookings booking
    join public.rides ride on ride.id = booking.ride_id
    where booking.id = booking_id
      and booking.ride_id = ride_id
      and booking.payment_status = 'paid'
      and booking.trip_status = 'completed'
      and (
        (
          context = 'driver'
          and booking.user_id = auth.uid()
          and reviewee_id = ride.driver_id
        )
        or (
          context = 'passenger'
          and ride.driver_id = auth.uid()
          and reviewee_id = booking.user_id
        )
      )
  )
);

drop policy if exists "admins_moderate_reviews" on public.ride_reviews;
create policy "admins_moderate_reviews"
on public.ride_reviews for update to authenticated
using (private.is_admin())
with check (private.is_admin());

create table if not exists public.rental_vehicle_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  owner_name text not null,
  phone text not null,
  location text not null,
  vehicle_type text not null,
  brand text not null,
  model text not null,
  vehicle_year integer,
  color text,
  plate_number text not null,
  seats integer not null check (seats > 0),
  price_per_day numeric not null check (price_per_day > 0),
  transmission text,
  fuel_type text,
  image_url text not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  published_vehicle_id uuid references public.vehicles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rental_vehicle_applications_user_idx
  on public.rental_vehicle_applications (user_id, created_at desc);

create index if not exists rental_vehicle_applications_status_idx
  on public.rental_vehicle_applications (status, created_at desc);

alter table public.rental_vehicle_applications enable row level security;

drop policy if exists "owners_read_own_rental_applications" on public.rental_vehicle_applications;
create policy "owners_read_own_rental_applications"
on public.rental_vehicle_applications for select to authenticated
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "owners_submit_rental_applications" on public.rental_vehicle_applications;
create policy "owners_submit_rental_applications"
on public.rental_vehicle_applications for insert to authenticated
with check (user_id = auth.uid() and status = 'pending');

drop policy if exists "admins_manage_rental_applications" on public.rental_vehicle_applications;
create policy "admins_manage_rental_applications"
on public.rental_vehicle_applications for all to authenticated
using (private.is_admin())
with check (private.is_admin());

alter table public.vehicles enable row level security;

drop policy if exists "published_vehicles_are_readable" on public.vehicles;
create policy "published_vehicles_are_readable"
on public.vehicles for select to anon, authenticated
using (true);

drop policy if exists "admins_manage_published_vehicles" on public.vehicles;
create policy "admins_manage_published_vehicles"
on public.vehicles for all to authenticated
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "authenticated_upload_rental_application_images" on storage.objects;
create policy "authenticated_upload_rental_application_images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vehicle-images'
  and (storage.foldername(name))[1] = 'rental-applications'
  and (storage.foldername(name))[2] = auth.uid()::text
);
