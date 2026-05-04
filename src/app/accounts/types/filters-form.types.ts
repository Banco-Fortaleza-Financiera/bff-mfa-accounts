import {
  FormControl,
  FormGroup
} from '@angular/forms';

import { Status } from '../interfaces/status.interface';

export type FiltersForm = FormGroup<{
  search: FormControl<string>;
  status: FormControl<Status | ''>;
  idUser: FormControl<number | null>;
  idAccountType: FormControl<number | null>;
  page: FormControl<number>;
  pageSize: FormControl<number>;
}>;
