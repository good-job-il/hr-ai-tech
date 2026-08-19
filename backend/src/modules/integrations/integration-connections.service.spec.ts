import { ConflictException, ForbiddenException } from '@nestjs/common';
import { IntegrationConnectionsService } from './integration-connections.service';

describe('IntegrationConnectionsService OA-3 feature flags', () => {
  it('does not expose a connect action when a provider is disabled', async () => {
    const connections = { find: jest.fn().mockResolvedValue([]), findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    const config = { get: jest.fn((_key, fallback) => fallback) };
    const service = new IntegrationConnectionsService(connections as any, config as any, { log: jest.fn() } as any);
    const actor = { id: 1, organization_id: 21, email: 'admin@test', role: 'org_admin' } as any;

    const catalog = await service.list(actor);
    expect(catalog.every(item => item.feature_available === false && item.status === 'disconnected')).toBe(true);
    await expect(service.connect('gmail', {} as any, actor)).rejects.toBeInstanceOf(ConflictException);
    expect(connections.save).not.toHaveBeenCalled();
  });

  it('persists connect and disconnect state when the provider is supported', async () => {
    let stored: any = null;
    const connections = {
      findOne: jest.fn(async () => stored),
      create: jest.fn(value => value),
      save: jest.fn(async value => (stored = { id: 8, ...value })),
    };
    const config = { get: jest.fn((key, fallback) => {
      if (key === 'INTEGRATION_GMAIL_ENABLED') return 'true';
      if (key === 'INTEGRATION_GMAIL_CONNECT_URL') return 'https://oauth.test/authorize';
      return fallback;
    }) };
    const service = new IntegrationConnectionsService(connections as any, config as any, { log: jest.fn() } as any);
    const actor = { id: 1, organization_id: 21, email: 'admin@test', role: 'org_admin' } as any;

    const connected = await service.connect('gmail', {} as any, actor);
    expect(connected.authorization_url).toMatch(/^https:\/\/oauth\.test\/authorize\?state=/);
    expect(stored.status).toBe('pending');

    const disconnected = await service.disconnect('gmail', actor);
    expect(disconnected.status).toBe('disconnected');
    expect(disconnected.oauth_state).toBeNull();
  });

  it('rejects recruitment manager integration mutations before persistence', async () => {
    const connections = { findOne: jest.fn(), create: jest.fn(), save: jest.fn() };
    const config = { get: jest.fn().mockReturnValue('true') };
    const service = new IntegrationConnectionsService(connections as any, config as any, { log: jest.fn() } as any);
    const manager = { id: 2, organization_id: 21, email: 'rm@test', role: 'recruitment_manager' } as any;

    await expect(service.connect('gmail', {} as any, manager)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.disconnect('gmail', manager)).rejects.toBeInstanceOf(ForbiddenException);
    expect(connections.findOne).not.toHaveBeenCalled();
    expect(connections.save).not.toHaveBeenCalled();
  });
});
