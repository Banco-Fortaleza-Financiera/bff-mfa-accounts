import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { DeviceContextService } from './device-context.service';
import { AccountTypesService } from './account-types.service';

describe('AccountTypesService', () => {
  let service: AccountTypesService;
  let deviceContextService: {
    getDeviceIp: jest.Mock<Promise<string>>;
    getSession: jest.Mock<string>;
    getAuthorization: jest.Mock<string>;
  };

  function httpResponse(body: unknown, status = 200) {
    return {
      ok: status >= 200 && status < 300,
      headers: new Headers(),
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
    };
  }

  beforeEach(() => {
    deviceContextService = {
      getDeviceIp: jest.fn().mockResolvedValue('10.0.0.2'),
      getSession: jest.fn().mockReturnValue('session-2'),
      getAuthorization: jest.fn().mockReturnValue('Bearer token-2'),
    };

    TestBed.configureTestingModule({
      providers: [
        AccountTypesService,
        { provide: DeviceContextService, useValue: deviceContextService },
      ],
    });

    service = TestBed.inject(AccountTypesService);
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('lists account types with device headers', async () => {
    const accountTypes = [
      { id: 1, accountType: 'Monetaria', accountCode: 'MON', status: 'ACTIVE' as const },
    ];
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse(accountTypes)
    );

    const response = await firstValueFrom(service.listAccountTypes());

    const [url, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(url).toBe('/channel/v1/account-types');
    expect(init.method).toBe('GET');
    expect(headers.get('x-device-ip')).toBe('10.0.0.2');
    expect(headers.get('x-session')).toBe('session-2');
    expect(headers.get('x-page-size')).toBe('100');
    expect(headers.get('Authorization')).toBe('Bearer token-2');
    expect(response).toEqual(accountTypes);
  });

  it('throws the api detail when the request fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse({ detail: 'No autorizado' }, 401)
    );

    await expect(firstValueFrom(service.listAccountTypes())).rejects.toThrow('No autorizado');
  });

  it('omits authorization when no token exists', async () => {
    deviceContextService.getAuthorization.mockReturnValue('');
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse([])
    );

    await firstValueFrom(service.listAccountTypes());

    const [, init] = (global.fetch as jest.Mock).mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;

    expect(headers.has('Authorization')).toBe(false);
  });
});
