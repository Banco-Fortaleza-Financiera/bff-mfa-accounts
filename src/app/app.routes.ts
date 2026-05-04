import { Routes } from '@angular/router';
import { AccountsListComponent } from './accounts/accounts-list/accounts-list.component';

export const routes: Routes = [
  {
    path: 'accounts',
    component: AccountsListComponent,
  },
  {
    path: '',
    redirectTo: 'accounts',
    pathMatch: 'full',
  },
];
