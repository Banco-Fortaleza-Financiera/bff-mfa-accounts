import { Status } from './status.interface';

export interface AccountResponse {
  id: number;
  idAccountType?: number | null;
  idUser?: number | null;
  accountNumber: string;
  balance: number;
  status: Status;
  created_at?: string | null;
  updated_at?: string | null;
}
