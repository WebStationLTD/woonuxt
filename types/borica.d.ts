export interface BoricaPaymentData {
  orderId: string;
  amount: number;
  currency?: string;
  description: string;
  customerEmail?: string;
  merchantData?: string;
}

export interface BoricaInitiateRequest extends BoricaPaymentData {
  currency: string;
}

export interface BoricaInitiateResponse {
  success: boolean;
  gatewayUrl?: string;
  parameters?: Record<string, string>;
  formData?: string;
  error?: string;
}

export interface BoricaCallbackData {
  ACTION: string;
  RC: string;
  APPROVAL: string;
  TERMINAL: string;
  TRTYPE: string;
  AMOUNT: string;
  CURRENCY: string;
  ORDER: string;
  RRN: string;
  INT_REF: string;
  PARES_STATUS: string;
  ECI: string;
  TIMESTAMP: string;
  NONCE: string;
  MERCH_TOKEN_ID: string;
  P_SIGN: string;
  STATUSMSG?: string;
}

export interface BoricaConfig {
  terminalId: string;
  privateKey: string;
  merchantName: string;
  merchantUrl: string;
  backrefUrl: string;
  gatewayUrl: string;
}

export interface BoricaPaymentResult {
  orderId: string;
  successful: boolean;
  amount: number;
  currency: string;
  responseCode: number;
  statusMessage?: string;
  approval?: string;
  rrn?: string;
  intRef?: string;
  timestamp: string;
}
