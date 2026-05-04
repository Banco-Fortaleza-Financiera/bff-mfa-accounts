import { Status } from './status.interface';

export interface AccountCreateRequest {
  idAccountType: number;
  idUser: number;
  status?: Status;
}
