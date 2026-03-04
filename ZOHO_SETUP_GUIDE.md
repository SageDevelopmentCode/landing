# Zoho Mail API Setup Guide

This guide will walk you through setting up Zoho Mail API integration to fetch sent emails in your admin dashboard.

## Prerequisites

- A Zoho Mail account
- Access to the Zoho Developer Console
- Your application running locally or deployed

## Step 1: Register Your Application at Zoho Developer Console

1. **Go to Zoho API Console**: https://api-console.zoho.com/

2. **Sign in** with your Zoho account

3. **Add a new client**:
   - Click **"Add Client"** button
   - Choose **"Server-based Applications"**

4. **Fill in the application details**:

   - **Client Name**: `Sagefield School Admin` (or any name you prefer)

   - **Homepage URL**:
     - For local development: `http://localhost:3000`
     - For production: `https://yourdomain.com`

   - **Authorized Redirect URIs**: This is important! Add the following:
     - For local development: `http://localhost:3000/api/zoho/callback`
     - For production: `https://yourdomain.com/api/zoho/callback`

     *Note: You can add multiple redirect URIs for different environments*

5. **Click "CREATE"**

6. **Save your credentials**: You'll see a screen with:
   - **Client ID** - Copy this
   - **Client Secret** - Copy this (you won't be able to see it again!)

## Step 2: Add Environment Variables

Add the following to your `.env.local` file:

```bash
# Zoho Mail API Configuration
ZOHO_CLIENT_ID=your_client_id_here
ZOHO_CLIENT_SECRET=your_client_secret_here
ZOHO_REDIRECT_URI=http://localhost:3000/api/zoho/callback
```

**For production**, create the same variables in your deployment platform (Vercel, etc.) with the production redirect URI.

## Step 3: Restart Your Development Server

Stop your current dev server (Ctrl+C) and restart:

```bash
npm run dev
```

## Step 4: Authorize Your Application

1. **Visit the authorization URL** in your browser:
   ```
   http://localhost:3000/api/zoho/authorize
   ```

2. **You'll be redirected to Zoho** where you need to:
   - Sign in to your Zoho account (if not already signed in)
   - Review the permissions requested
   - Click **"Accept"** to grant access

3. **You'll be redirected back** to a success page showing your refresh token

4. **Copy the environment variables** from the success page

5. **Add them to `.env.local`**:
   ```bash
   ZOHO_REFRESH_TOKEN=your_refresh_token_here
   ZOHO_ACCOUNT_ID=your_account_id_here  # Optional, will be fetched automatically if not provided
   ```

6. **Restart your dev server again**:
   ```bash
   npm run dev
   ```

## Step 5: Test the Integration

1. **Go to your admin dashboard**:
   ```
   http://localhost:3000/admin
   ```

2. **Check your terminal/console logs** - you should see:
   ```
   === ZOHO SENT EMAILS ===
   Total emails fetched: X
   [... email data ...]
   ========================
   ```

3. **If you see emails logged**, congratulations! The integration is working.

## Step 6: Production Deployment

When deploying to production:

1. **Register a production redirect URI** in Zoho Developer Console:
   ```
   https://yourdomain.com/api/zoho/callback
   ```

2. **Set environment variables** in your deployment platform:
   ```bash
   ZOHO_CLIENT_ID=your_client_id
   ZOHO_CLIENT_SECRET=your_client_secret
   ZOHO_REDIRECT_URI=https://yourdomain.com/api/zoho/callback
   ```

3. **Authorize in production**:
   - Visit `https://yourdomain.com/api/zoho/authorize`
   - Complete the OAuth flow
   - Add `ZOHO_REFRESH_TOKEN` to your production environment variables

4. **Redeploy** your application

## Troubleshooting

### "Zoho Mail API is not configured"

**Cause**: Missing environment variables

**Solution**:
- Check that all required variables are set in `.env.local`:
  - `ZOHO_CLIENT_ID`
  - `ZOHO_CLIENT_SECRET`
  - `ZOHO_REDIRECT_URI`
  - `ZOHO_REFRESH_TOKEN`
- Restart your dev server

### "Redirect URI mismatch"

**Cause**: The redirect URI in your `.env.local` doesn't match what you registered in Zoho Developer Console

**Solution**:
- Make sure `ZOHO_REDIRECT_URI` exactly matches the authorized redirect URI in Zoho Console
- Include the protocol (`http://` or `https://`)
- Don't include trailing slashes

### "Invalid refresh token" or "Token expired"

**Cause**: The refresh token has been revoked or is invalid

**Solution**:
- Go through the authorization flow again: `/api/zoho/authorize`
- Get a new refresh token and update `.env.local`

### No emails showing in console

**Cause**: Multiple possible reasons

**Solution**:
1. Check that you have sent emails in your Zoho Mail account
2. Check terminal for error messages
3. Verify your Zoho account has a "Sent" folder
4. Try fetching emails via the API endpoint: `http://localhost:3000/api/zoho/emails`

### Rate limiting

**Cause**: Too many API requests to Zoho

**Solution**:
- Zoho has API rate limits
- The integration caches access tokens for 55 minutes to minimize token refresh calls
- Avoid fetching emails too frequently

## API Endpoints

### `/api/zoho/authorize`
- Initiates OAuth flow
- Redirects to Zoho login

### `/api/zoho/callback`
- Handles OAuth callback
- Exchanges authorization code for tokens
- Displays success page with refresh token

### `/api/zoho/emails`
- Fetches sent emails (authenticated endpoint)
- Query params: `?limit=50` (default: 50)
- Returns JSON with email data

## Security Notes

1. **Never commit `.env.local`** to version control
2. **Refresh tokens provide full access** to your Zoho Mail - keep them secure
3. **All API calls are server-side** - tokens never reach the browser
4. **The admin routes are protected** by your existing Supabase authentication

## Email Data Structure

Each email object contains:

```typescript
{
  messageId: string
  fromAddress: string
  toAddress: string
  ccAddress?: string
  bccAddress?: string
  subject: string
  content: string        // Full HTML content
  summary: string        // Plain text summary
  time: number          // Unix timestamp
  hasAttachment: boolean
  attachments?: Array<{
    attachmentName: string
    attachmentSize: number
    attachmentPath: string
  }>
}
```

## Next Steps

Now that emails are being fetched and logged, you can:

1. **Display emails in the UI** instead of just console logging
2. **Create a dedicated emails page** at `/admin/emails`
3. **Add search/filter functionality** for emails
4. **Show email previews** or full content in modals
5. **Track email metrics** (total sent, by date, etc.)

## Support

For Zoho API documentation, visit:
- OAuth 2.0: https://www.zoho.com/mail/help/api/using-oauth-2.html
- Email API: https://www.zoho.com/mail/help/api/email-api.html
- Developer Console: https://api-console.zoho.com/

---

**Setup completed successfully when**: You see sent emails logged in the console when visiting `/admin`
