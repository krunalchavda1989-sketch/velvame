## Changes to Registration Form (`src/pages/Register.tsx`)

### 1. Mobile Number field
- Add a required **Mobile Number** input between Email and Password.
- Validate as a 10-digit Indian mobile (regex `^[6-9]\d{9}$`) before submit; show a clear toast on failure.
- Pass it through to `supabase.auth.signUp` inside `options.data.phone` (alongside `full_name` and `referral_code`).

### 2. Persist mobile on the profile
- Update the `handle_new_user` database trigger so that when a new auth user is created, the value from `raw_user_meta_data->>'phone'` is written into `public.profiles.phone` (existing column used by Account Settings).
- No schema change — only the trigger function body is updated.

### 3. Lock the referral code when it comes from a link
- When the page loads with a `?ref=CODE` query parameter **and** `validate_referral_with_subscription` returns `valid: true`, mark the referral field as locked:
  - Render the `Referral Code` input as `readOnly` and `disabled`-styled (muted background, no caret, cursor `not-allowed`).
  - Add a small helper line: *"Referral code applied from your invite link."*
- If the link is invalid or the referrer is not subscribed, keep current behavior: clear the field, show the warning alert, and leave it editable so the user can type another code or leave it blank.
- If the user lands on `/register` without `?ref=`, the field stays fully editable as today.

### Out of scope
- No changes to login, no OTP verification on the phone number, no changes to existing users' phone numbers.
