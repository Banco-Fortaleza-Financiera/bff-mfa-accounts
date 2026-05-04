import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AccountCreateRequest } from '../interfaces/account-create-request.interface';
import { AccountTypeResponse } from '../interfaces/account-type-response.interface';
import { AccountResponse } from '../interfaces/account-response.interface';
import { PageMetadata } from '../interfaces/page-metadata.interface';
import { Status } from '../interfaces/status.interface';
import { AccountTypesService } from '../services/account-types.service';
import { AccountsService } from '../services/accounts.service';
import { AccountForm } from '../types/account-form.types';
import { FiltersForm } from '../types/filters-form.types';

@Component({
  selector: 'app-accounts-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './accounts-list.component.html',
  styleUrl: './accounts-list.component.scss',
})
export class AccountsListComponent implements OnInit {
  readonly accounts = signal<AccountResponse[]>([]);
  readonly accountTypes = signal<AccountTypeResponse[]>([]);

  readonly isLoading = signal(false);
  readonly isLoadingAccountTypes = signal(false);
  readonly isSaving = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly page = signal<PageMetadata>({
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 1,
  });

  readonly statuses: Status[] = ['ACTIVE', 'INACTIVE'];

  readonly filtersForm: FiltersForm;
  readonly accountForm: AccountForm;

  private readonly fb = inject(FormBuilder);
  private readonly accountsService = inject(AccountsService);
  private readonly accountTypesService = inject(AccountTypesService);

  constructor() {
    this.filtersForm = this.createFiltersForm();
    this.accountForm = this.createAccountForm();
  }

  ngOnInit(): void {
    this.loadAccountTypes();
    this.loadAccounts();
  }

  loadAccountTypes(): void {
    this.isLoadingAccountTypes.set(true);
    this.errorMessage.set('');

    this.accountTypesService.listAccountTypes().subscribe({
      next: (accountTypes) => {
        this.accountTypes.set(accountTypes);
        this.isLoadingAccountTypes.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoadingAccountTypes.set(false);
      },
    });
  }

  loadAccounts(page = this.filtersForm.controls.page.value): void {
    if (this.filtersForm.invalid) {
      this.filtersForm.markAllAsTouched();
      return;
    }

    const filters = this.filtersForm.getRawValue();
    const pageToLoad = Math.max(1, page);
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.accountsService
      .listAccounts({
        page: pageToLoad,
        pageSize: filters.pageSize,
        search: filters.search,
        idUser: filters.idUser,
        idAccountType: filters.idAccountType,
        status: filters.status,
      })
      .subscribe({
        next: (response) => {
          this.accounts.set(response.data);
          this.page.set(response.page);
          this.filtersForm.controls.page.setValue(response.page.page, { emitEvent: false });
          this.filtersForm.controls.pageSize.setValue(response.page.pageSize, { emitEvent: false });
          this.isLoading.set(false);
        },
        error: (error: Error) => {
          this.errorMessage.set(error.message);
          this.isLoading.set(false);
        },
      });
  }

  createAccount(): void {
    if (this.accountForm.invalid) {
      this.accountForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.accountsService.createAccount(this.toAccountCreateRequest()).subscribe({
      next: () => {
        this.successMessage.set('Cuenta creada correctamente.');
        this.resetAccountForm();
        this.filtersForm.controls.page.setValue(1);
        this.loadAccounts(1);
        this.isSaving.set(false);
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isSaving.set(false);
      },
    });
  }

  toggleStatus(account: AccountResponse): void {
    const nextStatus: Status = account.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.accountsService.updateAccountStatus(account.id, nextStatus).subscribe({
      next: () => {
        this.successMessage.set(`Cuenta ${nextStatus === 'ACTIVE' ? 'activada' : 'inactivada'} correctamente.`);
        this.loadAccounts();
      },
      error: (error: Error) => {
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
      },
    });
  }

  previousPage(): void {
    const current = this.page();
    if (current.page > 1) {
      this.loadAccounts(current.page - 1);
    }
  }

  nextPage(): void {
    const current = this.page();
    if (this.canGoNextPage()) {
      this.loadAccounts(current.page + 1);
    }
  }

  canGoNextPage(): boolean {
    const current = this.page();
    return current.page < current.totalPages;
  }

  hasError(control: AbstractControl, error: string): boolean {
    return control.touched && control.hasError(error);
  }

  formatBalance(balance: number): string {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2,
    }).format(balance);
  }

  accountTypeLabel(accountType: AccountTypeResponse): string {
    return `${accountType.accountType} (${accountType.accountCode})`;
  }

  accountTypeName(idAccountType?: number | null): string {
    if (!idAccountType) {
      return '-';
    }

    const accountType = this.accountTypes().find((type) => type.id === idAccountType);
    return accountType ? this.accountTypeLabel(accountType) : String(idAccountType);
  }

  private createFiltersForm(): FiltersForm {
    return this.fb.group({
      search: this.fb.nonNullable.control('', [Validators.maxLength(128)]),
      status: this.fb.nonNullable.control('' as Status | ''),
      idUser: this.fb.control<number | null>(null, [Validators.min(1)]),
      idAccountType: this.fb.control<number | null>(null, [Validators.min(1)]),
      page: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
      pageSize: this.fb.nonNullable.control(10, [Validators.required, Validators.min(1), Validators.max(100)]),
    });
  }

  private createAccountForm(): AccountForm {
    return this.fb.group({
      idUser: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      idAccountType: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
      status: this.fb.nonNullable.control('ACTIVE' as Status),
    });
  }

  private toAccountCreateRequest(): AccountCreateRequest {
    const value = this.accountForm.getRawValue();

    return {
      idUser: Number(value.idUser),
      idAccountType: Number(value.idAccountType),
      status: value.status,
    };
  }

  private resetAccountForm(): void {
    this.accountForm.reset({
      idUser: null,
      idAccountType: null,
      status: 'ACTIVE',
    });
  }
}
