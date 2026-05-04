import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccountTypeResponse } from '../interfaces/account-type-response.interface';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';
import { DeviceContextService } from './device-context.service';

@Injectable({ providedIn: 'root' })
export class AccountTypesService {
  private readonly baseUrl = `${environment.accountsApiBaseUrl}/account-types`;
  private readonly deviceContextService = inject(DeviceContextService);

  listAccountTypes(): Observable<AccountTypeResponse[]> {
    return from(
      this.headers()
        .then((headers) => this.request<AccountTypeResponse[]>(this.baseUrl, { method: 'GET', headers }))
        .then((response) => response.body)
    );
  }

  private async headers(): Promise<Headers> {
    const headers = new Headers({
      'x-device-ip': await this.deviceContextService.getDeviceIp(),
      'x-session': this.deviceContextService.getSession(),
      'x-page-size': '100',
    });
    const authorization = this.deviceContextService.getAuthorization();

    if (authorization) {
      headers.set('Authorization', authorization);
    }

    return headers;
  }

  private request<T>(url: string, init: RequestInit): Promise<{ body: T; headers: Headers }> {
    return fetch(url, init).then(async (response) => {
      const body = await this.readJson<T | ApiErrorResponse>(response);

      if (!response.ok) {
        const apiError = body as ApiErrorResponse;
        throw new Error(apiError.message || apiError.detail || 'No fue posible completar la operacion.');
      }

      return {
        body: body as T,
        headers: response.headers,
      };
    });
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
}
