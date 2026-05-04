import { Status } from './status.interface';

export interface AccountTypeResponse {
  id: number;
  accountType: string;
  accountCode: string;
  status: Status;
  created_at?: string | null;
  updated_at?: string | null;
}
