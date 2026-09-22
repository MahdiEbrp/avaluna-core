/** Outbound ports. Live Iran adapters must implement these; domain stays HTTP-free. */

export type PaymentStartInput = {
  amountRial: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
  email?: string;
  orderId?: string;
};

export type PaymentStartResult = {
  authority: string;
  redirectUrl: string;
};

export type PaymentVerifyInput = {
  authority: string;
  amountRial: number;
};

export type PaymentVerifyResult = {
  ok: boolean;
  reference: string | null;
  code: number;
};

export interface PaymentAdapter {
  readonly id: string;
  start(input: PaymentStartInput): Promise<PaymentStartResult>;
  verify(input: PaymentVerifyInput): Promise<PaymentVerifyResult>;
}

export type SmsSendInput = {
  toE164: string;
  body: string;
  sender?: string;
  template?: string;
};

export interface SmsAdapter {
  readonly id: string;
  send(input: SmsSendInput): Promise<{ providerMessageId: string }>;
}

export type EmailSendInput = {
  to: string;
  subject: string;
  body: string;
  from?: string;
};

export interface EmailAdapter {
  readonly id: string;
  send(input: EmailSendInput): Promise<{ providerMessageId: string }>;
}

export type LabelInput = {
  carrier: string;
  weightGrams: number;
  postcode: string;
  city: string;
};

export interface CarrierAdapter {
  readonly id: string;
  quote(input: LabelInput): Promise<{ amountRial: number; days: number }>;
  buyLabel(input: LabelInput): Promise<{ trackingNumber: string }>;
}
