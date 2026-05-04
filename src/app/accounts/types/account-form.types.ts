import {
  FormControl,
  FormGroup
} from '@angular/forms';

import { Status } from '../interfaces/status.interface';

export type AccountForm = FormGroup<{
  idUser: FormControl<number | null>;
  idAccountType: FormControl<number | null>;
  status: FormControl<Status>;
}>;
