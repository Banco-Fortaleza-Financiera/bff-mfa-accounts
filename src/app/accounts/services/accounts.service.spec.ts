import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DeviceContextService } from './device-context.service';
import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  let service: AccountsService;
  let deviceContextService: {
    getDeviceIp: jest.Mock<Promise<string>>;
    getSession: jest.Mock<string>;
    getAuthorization: jest.Mock<string>;
  };

  const account = {
    id: 1,
    idAccountType: 2,
    idUser: 3,
    accountNumber: '001',
    balance: '125.50' as unknown as number,
    status: 'ACTIVE' as const,
  };

  function httpResponse(body: unknown, status = 200, headers = new Headers()) {
    return {
      ok: status >= 200 && status < 300,
      headers,
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    };
  }

  beforeEach(() => {
    deviceContextService = {
      getDeviceIp: jest.fn().mockResolvedValue('10.0.0.1'),
      getSession: jest.fn().mockReturnValue('session-1'),
      getAuthorization: jest.fn().mockReturnValue('Bearer token-1'),
    };

    TestBed.configureTestingModule({
      providers: [
        AccountsService,
        { provide: DeviceContextService, useValue: deviceContextService },
      ],
    });

    service = TestBed.inject(AccountsService);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists accounts with filters, headers and normalized balance', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse(
        [account],
        200,
        new Headers({
          'x-page': '2',
          'x-page-size': '5',
          'x-total-count': '8',
          'x-total-pages': '2',
        })
      )
    );

    const response = await firstValueFrom(
      service.listAccounts({
        page: 2,
        pageSize: 5,
        search: '  ahorro  ',
        idUser: 3,
        idAccountType: 2,
        status: 'ACTIVE',
      })
    );

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe('/channel/v1/accounts?search=ahorro&idUser=3&idAccountType=2&status=ACTIVE');
    expect(init.method).toBe('GET');
    expect(headers.get('x-device-ip')).toBe('10.0.0.1');
    expect(headers.get('x-session')).toBe('session-1');
    expect(headers.get('Authorization')).toBe('Bearer token-1');
    expect(headers.get('x-page')).toBe('2');
    expect(headers.get('x-page-size')).toBe('5');
    expect(response.data[0].balance).toBe(125.5);
    expect(response.page.totalCount).toBe(8);
  });

  it('creates an account with json headers', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse(account, 201)
    );

    const response = await firstValueFrom(
      service.createAccount({
        idUser: 3,
        idAccountType: 2,
        status: 'ACTIVE',
      })
    );

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(init.method).toBe('POST');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(init.body).toBe(JSON.stringify({ idUser: 3, idAccountType: 2, status: 'ACTIVE' }));
    expect(response.balance).toBe(125.5);
  });

  it('updates status using a small request body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse({ ...account, status: 'INACTIVE' })
    );

    await firstValueFrom(service.updateAccountStatus(1, 'INACTIVE'));

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe('/channel/v1/accounts/1');
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ status: 'INACTIVE' }));
  });

  it('gets an account by number with the account number encoded', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse(account)
    );

    await firstValueFrom(service.getAccountByNumber('001 / GTQ'));

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];

    expect(url).toBe('/channel/v1/accounts/number/001%20%2F%20GTQ');
    expect(init.method).toBe('GET');
  });

  it('throws the api message when the request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse({ message: 'Cuenta no encontrada' }, 404)
    );

    await expect(firstValueFrom(service.getAccountById(99))).rejects.toThrow('Cuenta no encontrada');
  });

  it('does not send authorization when there is no token', async () => {
    deviceContextService.getAuthorization.mockReturnValue('');
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse(account)
    );

    await firstValueFrom(service.getAccountById(1));

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(headers.has('Authorization')).toBe(false);
  });
});
