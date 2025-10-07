import nodemailer from 'nodemailer'

async function getTransporter(){
    const hasCreds = !!(process.env.SMTP_USER && process.env.SMTP_PASS)
    if (hasCreds) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: Number(process.env.SMTP_PORT || 587),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        })
    }
    // Fallback to ethereal test account for dev
    const testAccount = await nodemailer.createTestAccount()
    console.info('Using Nodemailer test account. Set SMTP_USER/SMTP_PASS to send real emails.')
    return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass
        }
    })
}

export async function sendVerificationEmail(toEmail, name, token){
    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const verifyLink = `${appUrl}/verify-email?token=${token}`

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Verify Your MediCare Account</h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${name}</strong>,
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Thank you for creating your MediCare account! To complete your registration, please verify your email address by clicking the button below:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${verifyLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Verify Email Address
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 25px 0;">
                    <strong>Important:</strong> This verification link will expire in 24 hours. If you did not create this account, you can safely ignore this email.
                </p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">What happens next?</h3>
                    <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                        <li>Click the verification button above</li>
                        <li>Your email will be verified automatically</li>
                        <li>You'll receive a welcome email</li>
                        <li>You can then log in to your account</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 MediCare. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    `

    const transporter = await getTransporter()
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@medicare.local',
        to: toEmail,
        subject: 'Verify your MediCare email',
        html
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.info('Verification email preview:', preview)
}

export async function sendPasswordResetEmail(toEmail, name, token){
    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const resetLink = `${appUrl}/reset-password?token=${token}`

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Reset Your MediCare Password</h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${name}</strong>,
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    We received a request to reset your password. Click the button below to create a new password. This link expires in 30 minutes.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin: 25px 0;">
                    <strong>Security Note:</strong> If you did not request this password reset, please ignore this email. Your password will remain unchanged.
                </p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">What happens next?</h3>
                    <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
                        <li>Click the reset button above</li>
                        <li>You'll be taken to a secure password reset page</li>
                        <li>Enter your new password</li>
                        <li>You can then log in with your new password</li>
                    </ul>
                </div>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 MediCare. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    `

    const transporter = await getTransporter()
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@medicare.local',
        to: toEmail,
        subject: 'Reset your MediCare password',
        html
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.info('Password reset email preview:', preview)
}

export async function sendWelcomeEmail(toEmail, name, role){
    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const loginLink = `${appUrl}/login`

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to MediCare! 🎉</h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${name}</strong>,
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Your email has been successfully verified! You're now ready to access your MediCare account and enjoy our healthcare services.
                </p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 5px;">
                    <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Account Details:</h3>
                    <p style="color: #1e40af; margin: 0; font-size: 14px;">
                        <strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}<br>
                        <strong>Status:</strong> Active and Verified
                    </p>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Click the button below to log in to your account:
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Login to MediCare
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
                    If you have any questions or need assistance, please don't hesitate to contact our support team.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 MediCare. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    `

    const transporter = await getTransporter()
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@medicare.local',
        to: toEmail,
        subject: 'Welcome to MediCare - Your Account is Now Active!',
        html
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.info('Welcome email preview:', preview)
}

export async function sendStaffWelcomeEmail(toEmail, name, role, additionalInfo = {}){
    const appUrl = process.env.APP_URL || 'http://localhost:5173'
    const loginLink = `${appUrl}/login`

    // Role-specific information
    let roleSpecificInfo = ''
    if (role === 'doctor') {
        roleSpecificInfo = `
            <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Doctor Profile Information:</h3>
                <p style="color: #1e40af; margin: 0; font-size: 14px;">
                    <strong>Specialization:</strong> ${additionalInfo.specialization || 'Not specified'}<br>
                    
                </p>
            </div>
        `
    } else if (role === 'pharmacist') {
        roleSpecificInfo = `
            <div style="background-color: #f0f9ff; border-left: 4px solid #059669; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #047857; margin: 0 0 10px 0; font-size: 18px;">Pharmacist Profile Information:</h3>
                <p style="color: #047857; margin: 0; font-size: 14px;">
                    <strong>License Number:</strong> ${additionalInfo.licenseNumber || 'Not specified'}<br>
                    <strong>Experience:</strong> ${additionalInfo.experience || 'Not specified'} years<br>
                    <strong>Registration Number:</strong> ${additionalInfo.registrationNumber || 'Not specified'}
                </p>
            </div>
        `
    } else if (role === 'delivery_agent') {
        roleSpecificInfo = `
            <div style="background-color: #f0f9ff; border-left: 4px solid #7c3aed; padding: 20px; margin: 20px 0; border-radius: 5px;">
                <h3 style="color: #6d28d9; margin: 0 0 10px 0; font-size: 18px;">Delivery Agent Profile Information:</h3>
                <p style="color: #6d28d9; margin: 0; font-size: 14px;">
                    <strong>Vehicle Number:</strong> ${additionalInfo.vehicleNumber || 'Not specified'}<br>
                    <strong>Registration Number:</strong> ${additionalInfo.registrationNumber || 'Not specified'}
                </p>
            </div>
        `
    }

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #2563eb; margin: 0; font-size: 28px;">Welcome to MediCare Team! 👨‍⚕️</h1>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Hello <strong>${name}</strong>,
                </p>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                    Welcome to the MediCare family! Your account has been successfully created by our administration team. You're now part of our healthcare service team.
                </p>
                
                <div style="background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 18px;">Account Details:</h3>
                    <p style="color: #1e40af; margin: 0; font-size: 14px;">
                        <strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}<br>
                        <strong>Email:</strong> ${toEmail}<br>
                        
                    </p>
                </div>
                
                ${roleSpecificInfo}
                
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 5px;">
                    <h3 style="color: #d97706; margin: 0 0 10px 0; font-size: 18px;">Next Steps:</h3>
                    <ol style="color: #d97706; margin: 0; padding-left: 20px;">
                       
                        <li>Log in to your dashboard</li>
                    </ol>
                </div>
                
                <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                    Once your email is verified, you'll be able to access your professional dashboard and start contributing to our healthcare services.
                </p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600; display: inline-block; font-size: 16px;">
                        Go to Login Page
                    </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; line-height: 1.5; margin-top: 30px; text-align: center;">
                    If you have any questions or need assistance, please contact our support team or your administrator.
                </p>
                
                <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        © 2024 MediCare. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    `

    const transporter = await getTransporter()
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@medicare.local',
        to: toEmail,
        subject: `Welcome to MediCare Team - ${role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')} Account Created!`,
        html
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.info('Staff welcome email preview:', preview)
}

// Sends a consolidated reorder email to a supplier for low-stock products
export async function sendReorderEmail(toEmail, { supplierName = 'Supplier', items = [], storeName = 'MediCare Pharmacy' } = {}){
    if (!toEmail || !Array.isArray(items) || items.length === 0) return

    const appUrl = process.env.APP_URL || 'http://localhost:5173'

    const rows = items.map((p) => `
        <tr>
            <td style="padding:8px;border:1px solid #e5e7eb;">${p.name}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${p.stock ?? 0}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;text-align:center;">${p.reorderLevel ?? 0}</td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${p.packSize || '-'}</td>
        </tr>
    `).join('')

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background-color: #ffffff; padding: 24px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.06);">
                <div style="margin-bottom: 16px;">
                    <h2 style="margin:0;color:#111827;">Automated Reorder Request</h2>
                    <p style="margin:4px 0 0;color:#6b7280;">${storeName}</p>
                </div>
                <p style="color:#374151;">Hello ${supplierName},</p>
                <p style="color:#374151;">We detected the following products are at or below the reorder threshold. Please process a restock at your earliest convenience.</p>
                <table style="width:100%;border-collapse:collapse;margin-top:12px;">
                    <thead>
                        <tr>
                            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb;">Product</th>
                            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;background:#f9fafb;">Current Stock</th>
                            <th style="padding:8px;border:1px solid #e5e7eb;text-align:center;background:#f9fafb;">Reorder Level</th>
                            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left;background:#f9fafb;">Pack</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
                <p style="color:#6b7280;margin-top:16px;">This email was generated automatically. For questions, contact the pharmacy team.</p>
                <div style="margin-top:16px;color:#9ca3af;font-size:12px;">${appUrl}</div>
            </div>
        </div>
    `

    const transporter = await getTransporter()
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'no-reply@medicare.local',
        to: toEmail,
        subject: 'Automated Reorder Request - Low Stock Items',
        html
    })
    const preview = nodemailer.getTestMessageUrl(info)
    if (preview) console.info('Reorder email preview:', preview)
}


