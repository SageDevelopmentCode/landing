import { NextRequest, NextResponse } from 'next/server'
import { exchangeAuthCode, getZohoAccountId } from '@/app/lib/zoho'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Check if user denied access
    if (error) {
      return NextResponse.redirect(
        new URL(
          `/admin?error=zoho_auth_denied&message=${encodeURIComponent(error)}`,
          request.url
        )
      )
    }

    // Check if authorization code is present
    if (!code) {
      return NextResponse.redirect(
        new URL('/admin?error=zoho_no_code', request.url)
      )
    }

    // Exchange authorization code for tokens
    const tokenData = await exchangeAuthCode(code)

    // Get account ID for convenience
    let accountId = ''
    try {
      // Temporarily set the refresh token in process.env for this request
      process.env.ZOHO_REFRESH_TOKEN = tokenData.refresh_token
      accountId = await getZohoAccountId()
    } catch (err) {
      console.error('Error getting account ID:', err)
    }

    // Return success page with tokens that need to be added to .env.local
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zoho OAuth Success</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #2d5016;
              margin-bottom: 20px;
            }
            .success {
              background: #d4edda;
              color: #155724;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 20px;
              border: 1px solid #c3e6cb;
            }
            .code-block {
              background: #f8f9fa;
              border: 1px solid #dee2e6;
              border-radius: 4px;
              padding: 15px;
              margin: 15px 0;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              overflow-x: auto;
            }
            .copy-btn {
              background: #2d5016;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 10px;
            }
            .copy-btn:hover {
              background: #1f3910;
            }
            .warning {
              background: #fff3cd;
              color: #856404;
              padding: 15px;
              border-radius: 4px;
              margin: 15px 0;
              border: 1px solid #ffeaa7;
            }
            .instructions {
              margin: 20px 0;
            }
            .step {
              margin: 15px 0;
              padding-left: 10px;
            }
            a {
              color: #2d5016;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✅ Zoho OAuth Authorization Successful!</h1>

            <div class="success">
              Successfully obtained OAuth tokens from Zoho Mail API.
            </div>

            <div class="warning">
              <strong>⚠️ Important:</strong> You need to manually add these values to your <code>.env.local</code> file.
            </div>

            <div class="instructions">
              <h2>Next Steps:</h2>

              <div class="step">
                <h3>1. Copy the following environment variables:</h3>
                <div class="code-block" id="env-vars">
ZOHO_REFRESH_TOKEN=${tokenData.refresh_token}
${accountId ? `ZOHO_ACCOUNT_ID=${accountId}` : '# ZOHO_ACCOUNT_ID will be fetched automatically'}
                </div>
                <button class="copy-btn" onclick="copyToClipboard()">Copy to Clipboard</button>
              </div>

              <div class="step">
                <h3>2. Add to your <code>.env.local</code> file:</h3>
                <p>Open your <code>.env.local</code> file and add the variables above.</p>
              </div>

              <div class="step">
                <h3>3. Restart your development server:</h3>
                <div class="code-block">
# Stop the current server (Ctrl+C) and run:
npm run dev
                </div>
              </div>

              <div class="step">
                <h3>4. Test the integration:</h3>
                <p>Go to your <a href="/admin">admin dashboard</a> and check the console for sent emails.</p>
              </div>
            </div>

            <div class="warning">
              <strong>Security Note:</strong> Never commit the <code>.env.local</code> file to version control.
              The refresh token provides access to your Zoho Mail account.
            </div>

            <p style="margin-top: 30px;">
              <a href="/admin">← Back to Admin Dashboard</a>
            </p>
          </div>

          <script>
            function copyToClipboard() {
              const text = document.getElementById('env-vars').textContent;
              navigator.clipboard.writeText(text.trim()).then(() => {
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = '✓ Copied!';
                setTimeout(() => {
                  btn.textContent = originalText;
                }, 2000);
              });
            }
          </script>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  } catch (error) {
    console.error('Error in OAuth callback:', error)

    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zoho OAuth Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 50px auto;
              padding: 20px;
              background: #f5f5f5;
            }
            .container {
              background: white;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 {
              color: #721c24;
            }
            .error {
              background: #f8d7da;
              color: #721c24;
              padding: 15px;
              border-radius: 4px;
              margin: 20px 0;
              border: 1px solid #f5c6cb;
            }
            a {
              color: #2d5016;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ OAuth Authorization Failed</h1>

            <div class="error">
              <strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error occurred'}
            </div>

            <p>Please try again or check your Zoho API configuration.</p>

            <p style="margin-top: 30px;">
              <a href="/api/zoho/authorize">← Try Again</a> |
              <a href="/admin">Back to Admin Dashboard</a>
            </p>
          </div>
        </body>
      </html>
      `,
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    )
  }
}
