import { Injectable, inject } from '@angular/core';
import { from, Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AccountCreateRequest } from '../interfaces/account-create-request.interface';
import { AccountListFilters } from '../interfaces/account-list-filters.interface';
import { AccountResponse } from '../interfaces/account-response.interface';
import { ApiErrorResponse } from '../interfaces/api-error-response.interface';
import { PagedResponse } from '../interfaces/paged-response.interface';
import { Status } from '../interfaces/status.interface';
import { StatusUpdateRequest } from '../interfaces/status-update-request.interface';
import { paginationFromHeaders } from '../utils/pagination.util';
import { DeviceContextService } from './device-context.service';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly baseUrl = `${environment.accountsApiBaseUrl}/accounts`;
  private readonly deviceContextService = inject(DeviceContextService);

  listAccounts(filters: AccountListFilters): Observable<PagedResponse<AccountResponse>> {
    const url = this.withParams(this.baseUrl, filters);
    return from(
      this.headers(filters)
        .then((headers) => this.request<AccountResponse[]>(url, { method: 'GET', headers }))
        .then((response) => ({
          data: response.body.map((account) => this.mapAccountResponse(account)),
          page: paginationFromHeaders(response.headers, filters),
        }))
    );
  }

  createAccount(request: AccountCreateRequest): Observable<AccountResponse> {
    return from(
      this.jsonHeaders()
        .then((headers) => this.request<AccountResponse>(this.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(request),
        }))
        .then((response) => this.mapAccountResponse(response.body))
    );
  }

  updateAccountStatus(id: number, status: Status): Observable<AccountResponse> {
    return from(
      this.jsonHeaders()
        .then((headers) => this.request<AccountResponse>(`${this.baseUrl}/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(this.statusRequest(status)),
        }))
        .then((response) => this.mapAccountResponse(response.body))
    );
  }

  getAccountById(id: number): Observable<AccountResponse> {
    return from(
      this.headers()
        .then((headers) => this.request<AccountResponse>(`${this.baseUrl}/${id}`, { method: 'GET', headers }))
        .then((response) => this.mapAccountResponse(response.body))
    );
  }

  getAccountByNumber(accountNumber: string): Observable<AccountResponse> {
    return from(
      this.headers()
        .then((headers) =>
          this.request<AccountResponse>(`${this.baseUrl}/number/${encodeURIComponent(accountNumber)}`, {
            method: 'GET',
            headers,
          })
        )
        .then((response) => this.mapAccountResponse(response.body))
    );
  }

  async headers(filters?: Partial<AccountListFilters>): Promise<Headers> {
    const headers = new Headers({
      'x-device-ip': await this.deviceContextService.getDeviceIp(),
      'x-session': this.deviceContextService.getSession(),
    });
    const authorization = this.deviceContextService.getAuthorization();

    if (authorization) {
      headers.set('Authorization', authorization);
    }

    if (filters?.page) {
      headers.set('x-page', String(filters.page));
    }

    if (filters?.pageSize) {
      headers.set('x-page-size', String(filters.pageSize));
    }

    return headers;
  }

  async jsonHeaders(): Promise<Headers> {
    const headers = await this.headers();
    headers.set('Content-Type', 'application/json');
    return headers;
  }

  statusRequest(status: Status): StatusUpdateRequest {
    return { status };
  }

  request<T>(url: string, init: RequestInit): Promise<{ body: T; headers: Headers }> {
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

  private withParams(url: string, filters: AccountListFilters): string {
    const params = new URLSearchParams();

    if (filters.search?.trim()) {
      params.set('search', filters.search.trim());
    }

    if (filters.idUser) {
      params.set('idUser', String(filters.idUser));
    }

    if (filters.idAccountType) {
      params.set('idAccountType', String(filters.idAccountType));
    }

    if (filters.status) {
      params.set('status', filters.status);
    }

    const query = params.toString();
    return query ? `${url}?${query}` : url;
  }

  private mapAccountResponse(account: AccountResponse): AccountResponse {
    return {
      ...account,
      balance: Number(account.balance ?? 0),
    };
  }

  private async readJson<T>(response: Response): Promise<T> {
    const text = await response.text();
    return (text ? JSON.parse(text) : null) as T;
  }
}
