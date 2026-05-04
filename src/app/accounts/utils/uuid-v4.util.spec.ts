import { generateUuidV4 } from './uuid-v4.util';

describe('generateUuidV4', () => {
  it('uses crypto.randomUUID when it is available', () => {
    const originalRandomUUID = crypto.randomUUID;
    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: jest.fn().mockReturnValue('11111111-1111-4111-8111-111111111111'),
    });

    expect(generateUuidV4()).toBe('11111111-1111-4111-8111-111111111111');

    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: originalRandomUUID,
    });
  });

  it('generates a valid v4 uuid without crypto.randomUUID', () => {
    const originalRandomUUID = crypto.randomUUID;
    const originalGetRandomValues = crypto.getRandomValues;
    let value = 0;

    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(crypto, 'getRandomValues', {
      configurable: true,
      value: jest.fn((array: Uint8Array) => {
        array[0] = value++;
        return array;
      }),
    });

    expect(generateUuidV4()).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );

    Object.defineProperty(crypto, 'randomUUID', {
      configurable: true,
      value: originalRandomUUID,
    });
    Object.defineProperty(crypto, 'getRandomValues', {
      configurable: true,
      value: originalGetRandomValues,
    });
  });
});
