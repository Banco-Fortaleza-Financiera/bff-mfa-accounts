import { NgModule } from '@angular/core';
import '@angular/compiler';
import { AccountsListComponent } from './accounts-list/accounts-list.component';

@NgModule({
  imports: [AccountsListComponent],
  exports: [AccountsListComponent],
})
export class AccountsModule {}

export { AccountsListComponent };
