# Send Email Edge Function

This Edge Function handles sending emails for Supabase Auth events, including user signup confirmations and magic link emails.

## Features

- **Email Confirmation**: Sends welcome emails when users sign up
- **Magic Link Emails**: Sends sign-in links for passwordless authentication
- **Custom Templates**: Uses React Email components for beautiful, responsive emails
- **Resend Integration**: Sends emails via Resend's email service

## Configuration

### Environment Variables

Make sure these environment variables are set in your Supabase project:

```bash
RESEND_API_KEY=your_resend_api_key_here
SUPABASE_URL=your_supabase_project_url
```

### Supabase Config

The function is configured to work with Supabase Auth hooks. In your `supabase/config.toml`:

```toml
[auth.hook.before_user_created]
enabled = true
uri = "http://127.0.0.1:54321/functions/v1/send-email"

[auth.email]
enable_confirmations = true

[auth.email.smtp]
enabled = true
host = "smtp.resend.com"
port = 587
user = "apikey"
pass = "env(RESEND_API_KEY)"
admin_email = "onboarding@lishka.dev"
sender_name = "Lishka"
```

## Email Templates

The function uses HTML templates located in `supabase/templates/`:

- `confirmation-email.html` - For user signup confirmations
- `magic-link.html` - For magic link sign-ins
- `invite.html` - For user invitations

## Testing

Use the `test.html` file to test the function locally:

1. Start your Supabase services: `supabase start`
2. Open `test.html` in your browser
3. Fill in the test data and click "Test Email Function"

## API Endpoint

**URL**: `POST /functions/v1/send-email`

**Request Body**:
```json
{
  "user": {
    "email": "user@example.com"
  },
  "email_data": {
    "token": "confirmation_token",
    "token_hash": "token_hash",
    "redirect_to": "http://localhost:3000",
    "email_action_type": "signup"
  },
  "type": "signup",
  "event": "user.created"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Email sent to user@example.com",
  "event": "user.created",
  "email_action_type": "signup"
}
```

## Troubleshooting

### Common Issues

1. **Base64 Decoding Error**: This was caused by using the wrong webhook verification library. The function now works directly with Supabase Auth hooks.

2. **Missing Environment Variables**: Ensure `RESEND_API_KEY` and `SUPABASE_URL` are set.

3. **SMTP Configuration**: Make sure your Resend API key is valid and the SMTP settings are correct.

### Logs

Check the Edge Function logs in your Supabase dashboard or local development console for debugging information.

## Development

To modify the email templates:

1. Edit the React components in `_templates/`
2. Update the HTML templates in `templates/`
3. Restart your Supabase services: `supabase restart`

## Production Deployment

When deploying to production:

1. Update the hook URI in `config.toml` to use your production Supabase URL
2. Ensure all environment variables are set in your production environment
3. Test the function thoroughly before going live
