import { TestBed } from '@angular/core/testing';

import { DeviceContextService } from './device-context.service';

describe('DeviceContextService', () => {
  let service: DeviceContextService;

  function httpResponse(body: unknown, headers = new Headers(), ok = true) {
    return {
      ok,
      headers,
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(String(body)),
    };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DeviceContextService],
    });
    service = TestBed.inject(DeviceContextService);
    localStorage.clear();
    sessionStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('uses the shell device ip when it exists', async () => {
    sessionStorage.setItem(
      'bff_shell_auth_session',
      JSON.stringify({ deviceIp: '172.16.0.10' })
    );

    await expect(service.getDeviceIp()).resolves.toBe('172.16.0.10');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('stores the device ip returned by the lookup service', async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      httpResponse({ ip: '8.8.8.8' }, new Headers({ 'content-type': 'application/json' }))
    );

    await expect(service.getDeviceIp()).resolves.toBe('8.8.8.8');
    expect(localStorage.getItem('bff.deviceIp')).toBe('8.8.8.8');
  });

  it('uses the default ip when lookup fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));

    await expect(service.getDeviceIp()).resolves.toBe('127.0.0.1');
  });

  it('reuses an existing session id from the shell', () => {
    sessionStorage.setItem(
      'bff_shell_auth_session',
      JSON.stringify({ sessionId: 'shell-session' })
    );

    expect(service.getSession()).toBe('shell-session');
  });

  it('creates and stores a session id when one does not exist', () => {
    expect(service.getSession()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
    expect(sessionStorage.getItem('bff.session')).toBeTruthy();
  });

  it('returns authorization when the shell session is authenticated and active', () => {
    sessionStorage.setItem(
      'bff_shell_auth_session',
      JSON.stringify({
        authenticated: true,
        accessToken: 'token-1',
        tokenType: 'Token',
        expiresAt: '2099-01-01T00:00:00.000Z',
      })
    );

    expect(service.getAuthorization()).toBe('Token token-1');
  });

  it('does not return authorization for expired sessions', () => {
    sessionStorage.setItem(
      'bff_shell_auth_session',
      JSON.stringify({
        authenticated: true,
        accessToken: 'token-1',
        expiresAt: '2000-01-01T00:00:00.000Z',
      })
    );

    expect(service.getAuthorization()).toBe('');
  });
});
