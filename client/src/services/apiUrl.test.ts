import { describe, it, expect, afterEach, vi } from 'vitest';
import { getApiBaseUrl } from './apiUrl';

const setLocation = (protocol: string, hostname: string) => {
  Object.defineProperty(window, 'location', {
    value: { protocol, hostname },
    writable: true,
    configurable: true
  });
};

describe('getApiBaseUrl', () => {
  const originalLocation = window.location;

  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      writable: true,
      configurable: true
    });
  });

  it('usa VITE_API_URL quando definido, ignorando window.location', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.exemplo.com/api');
    setLocation('http:', 'localhost');

    expect(getApiBaseUrl()).toBe('https://api.exemplo.com/api');
  });

  it('infere a URL a partir de localhost quando VITE_API_URL não está definido', () => {
    vi.stubEnv('VITE_API_URL', '');
    setLocation('http:', 'localhost');

    expect(getApiBaseUrl()).toBe('http://localhost:5005/api');
  });

  it('infere a URL a partir do IP de LAN usado para acessar o frontend', () => {
    vi.stubEnv('VITE_API_URL', '');
    setLocation('http:', '10.133.58.129');

    expect(getApiBaseUrl()).toBe('http://10.133.58.129:5005/api');
  });

  it('preserva o protocolo https quando o frontend é acessado via https', () => {
    vi.stubEnv('VITE_API_URL', '');
    setLocation('https:', 'taxonomy.empresa.com');

    expect(getApiBaseUrl()).toBe('https://taxonomy.empresa.com:5005/api');
  });
});
