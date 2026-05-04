export function generateUuidV4(): string {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (token) => {
    const value = crypto.getRandomValues(new Uint8Array(1))[0] & 15;
    const digit = token === 'x' ? value : (value & 3) | 8;
    return digit.toString(16);
  });
}
