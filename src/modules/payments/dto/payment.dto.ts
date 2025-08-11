export interface StripePaymentData {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      created: number;
      payment_intent?: string;
      customer?: string;
    };
  };
  created: number;
}

export interface AirwallexPaymentData {
  id: string;
  name: string;
  data: {
    object: {
      id: string;
      amount: number;
      currency: string;
      created_at: Date;
      payment_intent_id?: string;
      payment_method?: {
        customer_id?: string;
      };
    };
  };
}

export interface CreatePaymentDto {
  transactionId: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: Date;
  source: string;
  customerEmail?: string | null;
}

export interface ApiResponse<T = any> {
  message: string;
  statusCode: number;
  data: T;
}

export interface PaymentResponseDto extends ApiResponse {
  data: {
    id: string;
    transactionId: string;
    amount: number;
    currency: string;
    status: string;
    timestamp: Date;
    source: string;
    customerEmail?: string | null;
    ledgers?: any[];
    createdAt: Date;
    updatedAt: Date;
  }[];
}
