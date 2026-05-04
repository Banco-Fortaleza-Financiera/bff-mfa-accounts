import { Injectable } from '@angular/core';

import { environment } from '../../../environments/environment';
import { generateUuidV4 } from '../utils/uuid-v4.util';

interface DeviceIpLookupResponse {
  ip?: string;
  query?: string;
  origin?: string;
}

interface ShellAuthSession {
  authenticated?: boolean;
  accessToken?: string;
  tokenType?: string;
  expiresAt?: string;
  sessionId?: string;
  deviceIp?: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceContextService {
  private readonly shellAuthSessionStorageKey = 'bff_shell_auth_session';
  private readonly deviceIpStorageKey = 'bff.deviceIp';
  private readonly sessionStorageKey = 'bff.session';

  async getDeviceIp(): Promise<string> {
    const sessionDeviceIp = this.getShellAuthSession()?.deviceIp;

    if (sessionDeviceIp) {
      return sessionDeviceIp;
    }

    const storedIp = this.readStorage(localStorage, this.deviceIpStorageKey);

    if (storedIp) {
      return storedIp;
    }

    const resolvedIp = await this.fetchDeviceIp();
    this.writeStorage(localStorage, this.deviceIpStorageKey, resolvedIp);
    return resolvedIp;
  }

  getSession(): string {
    const shellSessionId = this.getShellAuthSession()?.sessionId;

    if (shellSessionId) {
      return shellSessionId;
    }

    const storedSession = this.readStorage(sessionStorage, this.sessionStorageKey);

    if (storedSession) {
      return storedSession;
    }

    const session = generateUuidV4();
    this.writeStorage(sessionStorage, this.sessionStorageKey, session);
    return session;
  }

  getAuthorization(): string {
    const shellSession = this.getShellAuthSession();

    if (!shellSession?.authenticated || !shellSession.accessToken || this.isExpired(shellSession)) {
      return '';
    }

    return `${shellSession.tokenType || 'Bearer'} ${shellSession.accessToken}`;
  }

  private async fetchDeviceIp(): Promise<string> {
    const lookupUrl = environment.deviceIpLookupUrl;

    if (!lookupUrl) {
      return environment.defaultDeviceIp;
    }

    try {
      const response = await fetch(lookupUrl, { method: 'GET' });

      if (!response.ok) {
        return environment.defaultDeviceIp;
      }

      const contentType = response.headers.get('content-type') ?? '';

      if (contentType.includes('application/json')) {
        const body = (await response.json()) as DeviceIpLookupResponse;
        return body.ip ?? body.query ?? body.origin ?? environment.defaultDeviceIp;
      }

      const ip = (await response.text()).trim();
      return ip || environment.defaultDeviceIp;
    } catch {
      return environment.defaultDeviceIp;
    }
  }

  private getShellAuthSession(): ShellAuthSession | null {
    const rawSession =
      this.readStorage(sessionStorage, this.shellAuthSessionStorageKey) ||
      this.readStorage(localStorage, this.shellAuthSessionStorageKey);

    if (!rawSession) {
      return null;
    }

    try {
      return JSON.parse(rawSession) as ShellAuthSession;
    } catch {
      return null;
    }
  }

  private isExpired(session: ShellAuthSession): boolean {
    if (!session.expiresAt) {
      return false;
    }

    return new Date(session.expiresAt).getTime() <= Date.now();
  }

  private readStorage(storage: Storage, key: string): string {
    try {
      return storage.getItem(key) ?? '';
    } catch {
      return '';
    }
  }

  private writeStorage(storage: Storage, key: string, value: string): void {
    try {
      storage.setItem(key, value);
    } catch {
      return;
    }
  }
}
