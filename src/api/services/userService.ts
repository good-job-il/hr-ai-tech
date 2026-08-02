import { ResourceService, ResourceQuery } from './resourceService';
import type { AuthUser } from './authService';

export const userService = new ResourceService<AuthUser, ResourceQuery>('/users');
