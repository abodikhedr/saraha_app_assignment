



export const template={
otpmail:(otp) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirm Email</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f8; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f4f6f8; padding: 40px 0;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 30px 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Saraha App</h1>
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px; color: #334155; text-align: left;">
                            <h2 style="margin-top: 0; font-size: 20px; color: #1e293b;">Email Verification</h2>
                            <p style="font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px;">
                                Thank you for signing up! Please use the verification code below to confirm your email address. This code is valid for <strong>2 minutes</strong>.
                            </p>
                            
                            <!-- OTP Box -->
                            <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 10px 0 25px 0;">
                                        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 6px; padding: 15px 30px; display: inline-block; letter-spacing: 6px; font-size: 32px; font-weight: 700; color: #4f46e5;">
                                            ${otp}
                                        </div>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="font-size: 14px; line-height: 1.5; color: #64748b; margin-top: 0;">
                                If you didn't request this code, you can safely ignore this email. Someone might have typed your email address by mistake.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #f8fafc; padding: 20px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                            <p style="margin: 0;">&copy; Saraha App. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
};