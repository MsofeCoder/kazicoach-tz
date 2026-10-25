export type NoticeTone = 'success' | 'error' | 'info' | 'loading';
export type Notice = { tone: NoticeTone; title: string; message: string };

// Never display raw provider messages: they may contain identifiers or server details.
export function authFailure(error: unknown, local = false): Notice {
  const data = error && typeof error === 'object' ? error as {code?: string; status?: number; name?: string} : {};
  const code = data.code;
  let message = 'The account service could not complete this request. Try again shortly. Your private practice remains available.';
  if (code === 'invalid_credentials') message = local
    ? 'These details were not accepted by the local test service. Accounts created on staging work only on staging.'
    : 'The email or password was not accepted. Check your details or use Forgot password? to reset your password.';
  else if (code === 'email_not_confirmed') message = 'Confirm your email before signing in. Check your inbox and Spam folder for the confirmation email.';
  else if (data.status === 429 || code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') message = 'Too many requests. Wait a few minutes before trying again; repeated attempts may extend the delay.';
  else if (code === 'weak_password') message = 'Choose at least 12 characters with uppercase and lowercase letters, a number and a symbol.';
  else if (code === 'same_password') message = 'Choose a different password from your current password.';
  else if (code === 'email_address_invalid') message = 'Enter a valid email address and try again.';
  else if (code === 'email_address_not_authorized' || code === 'unexpected_failure' || (data.status && data.status >= 500)) message = 'The account or email service could not complete this request. Try again later. If this continues, contact support to check the email configuration.';
  else if (!data.status || data.status === 0 || data.name === 'AuthRetryableFetchError') message = local
    ? 'The local test account service could not be reached. Use staging for your real account and email recovery, or start the local test service.'
    : 'The account service could not be reached. Check your connection and try again.';
  return {tone: 'error', title: 'Action could not be completed', message};
}

export async function requestRecovery(send: () => Promise<{error: unknown}>, local = false): Promise<Notice> {
  try {
    const result = await send();
    if (result.error) return authFailure(result.error, local);
    return {tone:'success', title:'Reset request accepted', message: local
      ? 'If this local test account is eligible, its reset link is available in the local test inbox. No real email is sent. Use staging for your real account.'
      : 'If this email has an eligible account, a reset link will arrive shortly. Check your inbox and Spam folder, and open it in this browser.'};
  } catch (error) { return authFailure(error, local); }
}
