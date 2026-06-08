# Ratings and Reviews Plan

Ratings should not be stored on bookings, profiles, or rides directly. A dedicated
moderatable table is needed before enabling reviews.

## Suggested schema

`ride_reviews`

- `id uuid primary key`
- `booking_id uuid references ride_bookings(id)` with a unique constraint
- `ride_id uuid references rides(id)`
- `passenger_id uuid references profiles(id)`
- `driver_id uuid references profiles(id)`
- `rating integer check (rating between 1 and 5)`
- `comment text`
- `status text` (`published`, `hidden`, `flagged`)
- `created_at timestamptz`
- `updated_at timestamptz`

## Passenger flow

- Show the review form only after `ride_bookings.trip_status = 'completed'`.
- Passenger can review only their own completed booking.
- One review per booking.

## Driver flow

- Driver can view aggregate rating and published reviews.
- A separate passenger-rating table should be considered later rather than
  mixing driver and passenger reviews.

## Admin moderation

- Admin can hide or restore reviews and inspect flagged comments.
- Reviews should never be hard-deleted automatically.

## Required safety

- RLS must enforce booking ownership and completed-trip eligibility.
- Rating aggregates should be derived from published reviews only.
