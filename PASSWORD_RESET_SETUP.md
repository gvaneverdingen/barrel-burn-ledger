# Password Reset Setup Instructions

The forgot password functionality has been implemented. **CRITICAL**: You must configure redirect URLs in Supabase for this to work.

## ⚠️ REQUIRED: Supabase Configuration

### Step 1: Configure Site URL
1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Set **Site URL** to your main application URL:
   - For development: `http://localhost:3000`
   - For production: `https://yourdomain.com`

### Step 2: Add Redirect URLs
In the same **URL Configuration** page, add these to **Redirect URLs**:
- `http://localhost:3000/reset-password` (for local development)
- `https://yourdomain.com/reset-password` (your production domain)
- Your Lovable preview URL + `/reset-password` (e.g., `https://yourproject.lovable.app/reset-password`)

**Without these URLs configured, you will get "Invalid Link" errors!**

## How It Works

1. **User Requests Reset**: On the sign-in page, users click "Forgot password?"
2. **Email Sent**: User enters their email and receives a password reset link
3. **Reset Password**: User clicks the link in their email and is redirected to `/reset-password`
4. **New Password**: User enters and confirms their new password
5. **Complete**: User is redirected back to the sign-in page

## Features

- ✅ Password strength validation (minimum 8 characters, uppercase, lowercase, number, special character)
- ✅ Password confirmation matching
- ✅ Email validation
- ✅ Secure token-based reset via Supabase Auth
- ✅ User-friendly error messages
- ✅ Loading states during submission
- ✅ Proper error handling for expired/invalid links

## Testing

1. Navigate to `/auth`
2. Click "Forgot password?" link
3. Enter your email address
4. Check your email for the reset link
5. Click the link and enter your new password
6. Sign in with the new password

## Troubleshooting

### "Invalid Link" Error
**Cause**: The redirect URL is not configured in Supabase.
**Solution**: Add your URL + `/reset-password` to the Redirect URLs list in Supabase (see Step 2 above).

### No Email Received
**Cause**: Email provider might be blocking emails or email is in spam.
**Solution**: 
- Check spam/junk folder
- Verify email address is correct
- Check Supabase email settings in Authentication → Email Templates

### Link Expired
**Cause**: Password reset links expire after a set time (default: 1 hour).
**Solution**: Request a new password reset link.

## Security Notes

- Password reset links expire after a set time (configured in Supabase, default: 1 hour)
- Links can only be used once
- Passwords must meet strength requirements
- All validation is performed both client-side and server-side
- Rate limiting on sign-in attempts (5 attempts per 15 minutes)
