/**
 * Configuración de entorno LOCAL
 */

export const environment = {
  production: false,
  environment: 'local',
  accountsApiBaseUrl: 'http://localhost:8082/channel/v1',
  deviceIpLookupUrl: 'https://api.ipify.org?format=json',
  defaultDeviceIp: "127.0.0.1"
};
