# Authentication Production Configuration

## Vercel environment variables

Production:

- `NEXT_PUBLIC_SITE_URL=https://www.sharpsharpride.com`
- `NEXT_PUBLIC_SUPABASE_URL=https://ivxsifbsecdsvffntyyi.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<Supabase anon key>`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<optional replacement for anon key>`
- `SUPABASE_SERVICE_ROLE_KEY=<server only>`
- `RESEND_API_KEY=<server only>`
- `EMAIL_FROM=SharpSharp Ride <support@sharpsharpride.com>`

Do not expose the service-role key, Resend key, Paystack secret, or Google client
secret through `NEXT_PUBLIC_*` variables.

## Supabase Authentication URL Configuration

- Site URL: `https://www.sharpsharpride.com`
- Redirect URL: `https://www.sharpsharpride.com/auth/callback**`
- Development redirect URL: `http://localhost:3000/auth/callback**`
- Temporary legacy redirect URL: `https://sharpsharpride.com/auth/callback**`

## Supabase Google provider

- Google provider must be enabled.
- Client ID and client secret must come from the same Google OAuth 2.0 Web
  application.
- Re-save the provider after rotating a secret.

## Google Cloud OAuth web client

Authorized JavaScript origins:

- `https://www.sharpsharpride.com`
- `http://localhost:3000`

Authorized redirect URI:

- `https://ivxsifbsecdsvffntyyi.supabase.co/auth/v1/callback`

The Google redirect URI must be the Supabase callback exactly. Do not add query
parameters or replace it with the SharpSharp callback.

## Google consent-screen text

Google can show `continue to ivxsifbsecdsvffntyyi.supabase.co` because Supabase
is the OAuth callback intermediary. Changing this requires configuring a
supported custom Supabase Auth domain and updating the Google redirect URI to
that custom Auth callback.
