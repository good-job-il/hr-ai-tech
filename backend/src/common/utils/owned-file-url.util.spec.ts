import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { assertOwnedFileUrl } from './owned-file-url.util';

describe('assertOwnedFileUrl', () => {
  const originalEnvironment = process.env;

  beforeEach(() => {
    process.env = { ...originalEnvironment, NODE_ENV: 'test' };
    delete process.env.API_PUBLIC_URL;
  });

  afterAll(() => {
    process.env = originalEnvironment;
  });

  it('accepts an application-owned local upload', () => {
    expect(assertOwnedFileUrl('http://localhost:3001/uploads/cv.pdf').pathname).toBe('/uploads/cv.pdf');
  });

  it.each([
    'https://attacker.example/uploads/cv.pdf',
    'http://localhost:3001/private/cv.pdf',
    'file:///uploads/cv.pdf',
  ])('rejects unowned URL %s', value => {
    expect(() => assertOwnedFileUrl(value)).toThrow(BadRequestException);
  });

  it('requires an explicit public origin in production', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertOwnedFileUrl('http://localhost:3001/uploads/cv.pdf'))
      .toThrow(ServiceUnavailableException);
  });
});
