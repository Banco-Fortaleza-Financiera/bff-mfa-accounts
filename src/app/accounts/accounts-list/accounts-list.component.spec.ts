import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AccountsListComponent } from './accounts-list.component';
import { AccountTypesService } from '../services/account-types.service';
import { AccountsService } from '../services/accounts.service';
import { AccountResponse } from '../interfaces/account-response.interface';

describe('AccountsListComponent', () => {
  let fixture: ComponentFixture<AccountsListComponent>;
  let component: AccountsListComponent;
  let accountsService: {
    listAccounts: jest.Mock;
    createAccount: jest.Mock;
    updateAccountStatus: jest.Mock;
  };
  let accountTypesService: {
    listAccountTypes: jest.Mock;
  };

  const account: AccountResponse = {
    id: 1,
    idAccountType: 2,
    idUser: 3,
    accountNumber: '001',
    balance: 100,
    status: 'ACTIVE',
  };

  beforeEach(async () => {
    accountsService = {
      listAccounts: jest.fn().mockReturnValue(
        of({
          data: [account],
          page: { totalCount: 1, page: 1, pageSize: 10, totalPages: 1 },
        })
      ),
      createAccount: jest.fn().mockReturnValue(of(account)),
      updateAccountStatus: jest.fn().mockReturnValue(of({ ...account, status: 'INACTIVE' })),
    };
    accountTypesService = {
      listAccountTypes: jest.fn().mockReturnValue(
        of([{ id: 2, accountType: 'Monetaria', accountCode: 'MON', status: 'ACTIVE' }])
      ),
    };

    await TestBed.configureTestingModule({
      imports: [AccountsListComponent],
      providers: [
        { provide: AccountsService, useValue: accountsService },
        { provide: AccountTypesService, useValue: accountTypesService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsListComponent);
    component = fixture.componentInstance;
  });

  it('loads account types and accounts on init', () => {
    component.ngOnInit();

    expect(accountTypesService.listAccountTypes).toHaveBeenCalled();
    expect(accountsService.listAccounts).toHaveBeenCalledWith({
      page: 1,
      pageSize: 10,
      search: '',
      idUser: null,
      idAccountType: null,
      status: '',
    });
    expect(component.accountTypes().length).toBe(1);
    expect(component.accounts()).toEqual([account]);
    expect(component.isLoading()).toBe(false);
  });

  it('marks the filters form when it is invalid', () => {
    component.filtersForm.controls.page.setValue(0);

    component.loadAccounts();

    expect(accountsService.listAccounts).not.toHaveBeenCalled();
    expect(component.filtersForm.controls.page.touched).toBe(true);
  });

  it('creates an account and reloads the first page', () => {
    component.accountForm.setValue({
      idUser: 3,
      idAccountType: 2,
      status: 'ACTIVE',
    });

    component.createAccount();

    expect(accountsService.createAccount).toHaveBeenCalledWith({
      idUser: 3,
      idAccountType: 2,
      status: 'ACTIVE',
    });
    expect(component.successMessage()).toBe('Cuenta creada correctamente.');
    expect(accountsService.listAccounts).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
    expect(component.isSaving()).toBe(false);
  });

  it('does not create an account when the form is invalid', () => {
    component.createAccount();

    expect(accountsService.createAccount).not.toHaveBeenCalled();
    expect(component.accountForm.controls.idUser.touched).toBe(true);
  });

  it('toggles the account status and reloads accounts', () => {
    component.toggleStatus(account);

    expect(accountsService.updateAccountStatus).toHaveBeenCalledWith(1, 'INACTIVE');
    expect(component.successMessage()).toBe('Cuenta inactivada correctamente.');
    expect(accountsService.listAccounts).toHaveBeenCalled();
  });

  it('shows an error when loading accounts fails', () => {
    accountsService.listAccounts.mockReturnValue(throwError(() => new Error('Error de cuentas')));

    component.loadAccounts();

    expect(component.errorMessage()).toBe('Error de cuentas');
    expect(component.isLoading()).toBe(false);
  });

  it('handles paging and display helpers', () => {
    component.page.set({ totalCount: 25, page: 2, pageSize: 10, totalPages: 3 });
    component.accountTypes.set([{ id: 2, accountType: 'Monetaria', accountCode: 'MON', status: 'ACTIVE' }]);

    component.previousPage();
    component.page.set({ totalCount: 25, page: 2, pageSize: 10, totalPages: 3 });
    component.nextPage();

    expect(accountsService.listAccounts).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
    expect(accountsService.listAccounts).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    component.page.set({ totalCount: 25, page: 2, pageSize: 10, totalPages: 3 });
    expect(component.canGoNextPage()).toBe(true);
    expect(component.accountTypeName(2)).toBe('Monetaria (MON)');
    expect(component.accountTypeName(null)).toBe('-');
    expect(component.formatBalance(100)).toContain('100.00');
  });
});
