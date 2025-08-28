# Disable Email Confirmation in Supabase

## Steps to disable email confirmation:

1. Go to your Supabase Dashboard
2. Navigate to: **Authentication** → **Settings** 
3. Scroll down to **"User Signups"** section
4. **UNCHECK** "Enable email confirmations"
5. Click **Save**

## Alternative: Manually confirm existing users

If you want to keep email confirmation enabled but confirm existing users:

1. Go to **Authentication** → **Users**
2. Find the unconfirmed user
3. Click the **"..."** menu next to their email
4. Select **"Send confirmation email"** OR manually set them as confirmed

## Note:
- Disabling email confirmation allows users to sign in immediately after signup
- This is recommended for development/testing
- For production, keep email confirmation enabled but ensure email delivery works properly