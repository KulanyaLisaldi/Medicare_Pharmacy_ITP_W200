# Email Setup for MediCare Pharmacy

## Overview
This application sends emails to staff members during the account creation and verification process. The email functionality includes:
1. **Verification Email** - Sent when a staff account is created by admin
2. **Welcome Email** - Sent after email verification with role-specific information

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM=no-reply@medicare.local

# App Configuration
APP_URL=http://localhost:5173
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-Factor Authentication

### 2. Generate App Password
- Go to Security settings
- Under "2-Step Verification", click "App passwords"
- Generate a new app password for "Mail"
- Use this password as `SMTP_PASS`

### 3. Alternative: Use Gmail OAuth2
For production, consider using OAuth2 instead of app passwords.

## Email Templates

### Staff Welcome Email
- **Subject**: "Welcome to MediCare Team - [Role] Account Created!"
- **Content**: 
  - Welcome message
  - Account details
  - Role-specific information
  - Next steps for login
  - Login link

### Verification Email
- **Subject**: "Verify your MediCare email"
- **Content**:
  - Verification link
  - 24-hour expiration notice
  - Account activation instructions

## Testing Email Functionality

1. **Development Mode**: Uses Nodemailer test account (no real emails sent)
2. **Production Mode**: Sends real emails using configured SMTP

### Test Account Preview
When using test accounts, check the console for preview URLs:
```
Verification email preview: https://ethereal.email/message/...
Staff welcome email preview: https://ethereal.email/message/... (after verification)
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Check SMTP_USER and SMTP_PASS
   - Ensure 2FA is enabled and app password is correct

2. **Connection Refused**
   - Verify SMTP_HOST and SMTP_PORT
   - Check firewall settings

3. **Emails Not Sending**
   - Check console for error messages
   - Verify environment variables are loaded
   - Ensure .env file is in backend root directory

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=mailer:*
```

## Security Notes

- Never commit .env files to version control
- Use strong, unique passwords for SMTP accounts
- Consider using environment-specific configurations
- Rotate SMTP credentials regularly in production
