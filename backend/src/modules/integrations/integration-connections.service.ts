import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { UserEntity } from '../users/user.entity';
import { ConnectIntegrationDto } from './dto/integration.dto';
import { IntegrationConnectionEntity } from './integration-connection.entity';

const PROVIDERS = {
  gmail: { name: 'Gmail', scopes: ['gmail.readonly', 'gmail.modify'] },
  google_calendar: { name: 'Google Calendar', scopes: ['calendar.events'] },
  linkedin: { name: 'LinkedIn', scopes: ['r_liteprofile'] },
} as const;

@Injectable()
export class IntegrationConnectionsService {
  constructor(
    @InjectRepository(IntegrationConnectionEntity) private readonly connections: Repository<IntegrationConnectionEntity>,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  async list(user: UserEntity) {
    const organizationId = this.organizationId(user);
    const existing = await this.connections.find({ where: { organization_id: organizationId } });
    return Object.entries(PROVIDERS).map(([provider, definition]) => {
      const connection = existing.find(item => item.provider === provider);
      const connectUrl = this.connectUrl(provider);
      return {
        provider,
        name: definition.name,
        feature_available: this.enabled(provider) && Boolean(connectUrl),
        required_scopes: definition.scopes,
        status: connection?.status || 'disconnected',
        scopes: connection?.scopes || [],
        external_account_label: connection?.external_account_label || null,
        last_sync_at: connection?.last_sync_at || null,
        last_sync_status: connection?.last_sync_status || null,
        last_error: connection?.last_error || null,
        connected_at: connection?.connected_at || null,
      };
    });
  }

  async connect(provider: string, dto: ConnectIntegrationDto, user: UserEntity) {
    const organizationId = this.organizationId(user);
    const definition = this.definition(provider);
    const connectUrl = this.connectUrl(provider);
    if (!this.enabled(provider) || !connectUrl) throw new ConflictException(`${definition.name} integration is not enabled`);
    const requestedScopes = dto.scopes?.length ? dto.scopes : [...definition.scopes];
    if (requestedScopes.some(scope => !definition.scopes.includes(scope as never))) throw new ForbiddenException('Unsupported integration scope');
    const state = randomUUID();
    let connection = await this.connections.findOne({ where: { organization_id: organizationId, provider } });
    connection = this.connections.create({
      ...(connection || {}), organization_id: organizationId, provider, status: 'pending', scopes: requestedScopes,
      oauth_state: state, last_error: null, disconnected_at: null,
    });
    const saved = await this.connections.save(connection);
    await this.audit.log({
      organization_id: String(organizationId), actor_user_id: String(user.id), actor_email: user.email, actor_role: user.role,
      entity_type: 'Integration', entity_id: saved.id, entity_label: definition.name, action: 'update',
      metadata: { status: 'pending', scopes: requestedScopes },
    });
    const url = new URL(connectUrl);
    url.searchParams.set('state', state);
    return { authorization_url: url.toString(), connection: saved };
  }

  reconnect(provider: string, dto: ConnectIntegrationDto, user: UserEntity) {
    return this.connect(provider, dto, user);
  }

  async disconnect(provider: string, user: UserEntity) {
    const organizationId = this.organizationId(user);
    const definition = this.definition(provider);
    const connection = await this.connections.findOne({ where: { organization_id: organizationId, provider } });
    if (!connection) throw new NotFoundException(`${definition.name} connection not found`);
    connection.status = 'disconnected';
    connection.oauth_state = null;
    connection.disconnected_at = new Date();
    const saved = await this.connections.save(connection);
    await this.audit.log({
      organization_id: String(organizationId), actor_user_id: String(user.id), actor_email: user.email, actor_role: user.role,
      entity_type: 'Integration', entity_id: saved.id, entity_label: definition.name, action: 'delete',
      metadata: { status: 'disconnected' },
    });
    return saved;
  }

  private definition(provider: string) {
    const definition = PROVIDERS[provider as keyof typeof PROVIDERS];
    if (!definition) throw new NotFoundException(`Integration ${provider} not found`);
    return definition;
  }

  private enabled(provider: string) {
    return this.config.get<string>(`INTEGRATION_${provider.toUpperCase()}_ENABLED`, 'false') === 'true';
  }

  private connectUrl(provider: string) {
    return this.config.get<string>(`INTEGRATION_${provider.toUpperCase()}_CONNECT_URL`, '');
  }

  private organizationId(user: UserEntity) {
    if (!user.organization_id) throw new ForbiddenException('Organization context required');
    return user.organization_id;
  }
}
