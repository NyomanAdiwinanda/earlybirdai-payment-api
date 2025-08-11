export interface CreateLedgerDto {
  paymentId: string;
  entryType: string;
  status: string;
  currency: string;
  credit?: number;
  debit?: number;
  conversionRate: number;
  creditBase?: number;
  debitBase?: number;
  balanceAfterBase: number;
  timestamp: Date;
  description: string;
}

export interface ApiResponse<T = any> {
  message: string;
  statusCode: number;
  data: T;
}

export interface LedgerEntry {
  id: string;
  paymentId: string;
  entryType: string;
  status: string;
  currency: string;
  credit: number;
  debit: number;
  conversionRate: number;
  creditBase: number;
  debitBase: number;
  balanceAfterBase: number;
  description: string;
  timestamp: Date;
  createdAt: Date;
  payment?: any;
}

export interface LedgerEntriesResponseDto extends ApiResponse {
  data: LedgerEntry[];
}

export interface BalanceResponseDto extends ApiResponse {
  data: {
    balance: number;
    currency: string;
  };
}
