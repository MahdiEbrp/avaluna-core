const OTP_TTL_MS = 5 * 60_000;
const OTP_LENGTH = 6;
const OTP_COOLDOWN_MS = 45_000;

export type OtpChallenge = {
  mobile: string;
  code: string;
  expiresAtMs: number;
  consumed: boolean;
};

const challenges = new Map<string, OtpChallenge>();

export function generateOtpCode(nowMs: number): string {
  const n = (nowMs % 1_000_000).toString().padStart(OTP_LENGTH, "0");
  return n.slice(-OTP_LENGTH);
}

export function issueOtp(mobile: string, nowMs: number, code = generateOtpCode(nowMs)): OtpChallenge {
  const prev = challenges.get(mobile);
  if (prev && prev.expiresAtMs - OTP_TTL_MS + OTP_COOLDOWN_MS > nowMs && !prev.consumed) {
    return prev;
  }
  const row: OtpChallenge = { mobile, code, expiresAtMs: nowMs + OTP_TTL_MS, consumed: false };
  challenges.set(mobile, row);
  return row;
}

export function verifyOtp(mobile: string, code: string, nowMs: number): boolean {
  const row = challenges.get(mobile);
  if (!row || row.consumed || row.expiresAtMs < nowMs || row.code !== code) {
    return false;
  }
  row.consumed = true;
  return true;
}

export function resetOtpStore(): void {
  challenges.clear();
}
