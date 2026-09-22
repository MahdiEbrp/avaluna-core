import { normalizeIranMobile } from "../../domain/iran";
import { issueOtp, verifyOtp } from "../../domain/otp";
import { signSession } from "../../domain/session-token";
import { loadRuntimeSecret } from "../runtime-secret";
import { getSmsAdapter } from "../../adapters/registry";
import { ApiError } from "../errors";
import { isYes, loadSettings, readMerged } from "../settings/store";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function requestOtp(mobileRaw: string) {
  const mobile = normalizeIranMobile(mobileRaw);
  if (!mobile) {
    throw new ApiError(400, "sms.invalid_recipient", "Recipient must be E.164 or an Iranian mobile number.");
  }
  const map = await loadSettings();
  const issued = issueOtp(mobile, Date.now());
  const sandbox = isYes(readMerged(map, "payments", "sandbox"));
  try {
    const sms = getSmsAdapter(map);
    await sms.send({
      toE164: mobile,
      body: `Avaluna code ${issued.code}`,
      template: readMerged(map, "sms", "otp_template"),
    });
  } catch (error) {
    if (!sandbox) {
      throw error;
    }
  }
  return sandbox ? { mobile, debug_code: issued.code } : { mobile };
}

export function confirmOtp(mobileRaw: string, code: string) {
  const mobile = normalizeIranMobile(mobileRaw);
  if (!mobile || !verifyOtp(mobile, code, Date.now())) {
    throw new ApiError(401, "auth.invalid_otp", "OTP is invalid or expired.");
  }
  const token = signSession(1, Date.now() + SESSION_TTL_MS, loadRuntimeSecret("AVALUNA_SESSION_SECRET", "session"));
  return { customer_id: 1, session: token, mobile };
}
