# Rental Owner Application Flow

The current `vehicles` table is used as published rental inventory and is
created directly by admins. It should not also be used as an unreviewed owner
application table.

## Recommended Tables

Create a dedicated `rental_vehicle_applications` table with:

- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id)`
- `owner_name text not null`
- `phone text not null`
- `vehicle_brand text not null`
- `vehicle_model text not null`
- `vehicle_year integer`
- `vehicle_color text`
- `plate_number text not null`
- `location text not null`
- `price_per_day numeric`
- `description text`
- `image_url text`
- `status text not null default 'pending'`
- `admin_note text`
- `reviewed_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## Policies

- Authenticated users can insert applications where `user_id = auth.uid()`.
- Users can read their own applications.
- Users cannot update `status`, `admin_note`, or `reviewed_at`.
- Admins can read and update all applications.
- Only admins can insert approved applications into the published `vehicles`
  table.

## Operational Flow

1. Owner submits an application and vehicle image.
2. Owner receives an in-app notification and confirmation email.
3. Admin reviews the application.
4. Approval creates a published `vehicles` record in the same transaction.
5. Approval or rejection creates a user notification and email.

## Required Routes

- `/rent/owner/apply`
- `/rent/owner/status`
- `/admin/rental-vehicle-applications`

This flow is intentionally not scaffolded against the existing `vehicles` table
because doing so would mix unverified submissions with customer-visible rental
inventory.
