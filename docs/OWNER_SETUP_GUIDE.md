# Your remaining setup steps

No source-code edits are needed on your side. Keep credentials, authenticator QR/seed and one-time codes private. These are instructions, not a claim that the steps have passed.

## 1. Prepare an email sender — your email provider

Use an SMTP provider/sender you control. Obtain its host, port, username and SMTP password/API credential. If it requires domain verification, add only the DNS records it provides in that domain's DNS dashboard. The Pages preview address is not a sending domain you own. Do not buy a service or change DNS blindly. See [official Supabase SMTP guidance](https://supabase.com/docs/guides/auth/auth-smtp).

## 2. Connect it — Supabase dashboard

Open [KaziCoach-TZ → Authentication → SMTP settings](https://supabase.com/dashboard/project/qkyuqfqrixohcbdkchoo/auth/smtp). Enable custom SMTP; enter your provider's host, port, username/password, approved sender email and sender name `KaziCoach TZ`. Save in the dashboard. Keep email confirmation enabled. Provider credentials go here, never into frontend files or chat. Verify delivery through the registration/recovery flow below.

## 3. Verify your account — KaziCoach staging

Open [the staging app](https://staging.kazicoach-tz-441.pages.dev/), then **menu → Settings**. Use your intended owner email and a unique password of at least 12 characters with uppercase/lowercase letters, a number and a symbol. Choose **Create account**. Open the confirmation email using the same browser/device that started registration (PKCE depends on that browser), then sign in. Also test **Forgot your password?** on your own account and confirm the recovery email arrives. Do not post recovery links, codes or passwords.

## 4. Owner security — we complete this in sequence

Tell me: **SMTP saved; confirmation/recovery tested; owner account ready**, stating any failure instead of marking it complete. I independently verify the intended identity and use the guarded audited bootstrap; an ordinary account does not grant itself Super Admin. Once assigned, open **Settings → Owner security**, enroll your authenticator and verify its code yourself. Protect your authenticator backup. Then we verify actual administration and remaining Samsung acceptance before public launch. No demo account becomes the real owner.

## Reopen the new-user guide

In the app, choose **Show me around** in the desktop sidebar/mobile menu, or the same button near the top of **Settings**. It covers Materials, Practice, Progress and optional accounts/privacy. New browsers see it automatically; existing workspaces and email callbacks are not interrupted. Closing or skipping remembers only a local dismissal marker. No answers, materials or account data are changed by the guide.
