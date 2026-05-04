import { Status } from './status.interface';

export interface AccountListFilters {
  page: number;
  pageSize: number;
  search?: string;
  idUser?: number | null;
  idAccountType?: number | null;
  status?: Status | '';
}
