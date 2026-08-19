# Feature Module Template

Use this template when creating a new feature module.

## Directory Structure

```
features/{feature-name}/
├── pages/                 # Smart components (connected to state)
│   └── {FeaturePage}.jsx
├── components/           # Dumb components (pure presentation)
│   └── {Component}.jsx
├── hooks/                # Custom hooks (feature-specific)
│   ├── use{Feature}.ts
│   └── index.ts
├── api/                  # API integration layer
│   ├── services.ts       # API calls
│   ├── hooks.ts          # useQuery/useMutation
│   ├── mappers.ts        # Response transformation
│   └── validators.ts     # Zod schemas
├── services/             # Business logic
│   └── {service}.ts
├── state/                # State management
│   ├── context.ts        # Context if needed
│   └── index.ts
├── utils/                # Feature utilities
│   └── {util}.ts
├── types/                # TypeScript types
│   └── index.ts
├── constants/            # Feature constants
│   └── index.ts
└── index.ts              # BARREL EXPORT ONLY
```

## Barrel Export Template

```typescript
// features/{feature}/index.ts
export * from './components';
export * from './hooks';
export * from './api';
export * from './types';
export * from './constants';
export { default as {FeaturePage} } from './pages/{FeaturePage}';
```

## Component Template

```typescript
// features/{feature}/components/{Component}.jsx
import { ReactNode } from 'react';

interface {Component}Props {
  title: string;
  disabled?: boolean;
  onAction?: () => void;
}

export default function {Component}({
  title,
  disabled = false,
  onAction
}: {Component}Props): ReactNode {
  return (
    <div className="p-4 rounded-lg bg-white border border-[#E4ECFF]">
      <h3 className="font-bold text-lg text-[#0F172A]">{title}</h3>
      <button
        onClick={onAction}
        disabled={disabled}
        className="mt-4 px-6 py-2 rounded-lg bg-gradient-to-l from-[#2F80FF] to-[#8B5CF6] text-white font-bold disabled:opacity-50"
      >
        Action
      </button>
    </div>
  );
}
```

## Page Template

```typescript
// features/{feature}/pages/{FeaturePage}.jsx
import { Suspense } from 'react';
import { use{Feature}Query } from '@/features/{feature}/hooks';
import { {Component} } from '@/features/{feature}/components';

export default function {FeaturePage}() {
  const { data, isLoading, error } = use{Feature}Query();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState />;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black text-[#0F172A]">Feature Title</h1>
      <{Component} data={data} />
    </div>
  );
}
```

## Hook Template

```typescript
// features/{feature}/hooks/use{Feature}.ts
import { useQuery } from '@tanstack/react-query';
import { get{Feature} } from '@/features/{feature}/api/services';
import { CACHE_TIMES } from '@/config/constants';

export function use{Feature}Query() {
  return useQuery({
    queryKey: ['{feature}'],
    queryFn: () => get{Feature}(),
    staleTime: CACHE_TIMES.MEDIUM,
    cacheTime: CACHE_TIMES.LONG,
  });
}

export function use{Feature}Mutation() {
  return useMutation({
    mutationFn: (data) => update{Feature}(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['{feature}']);
    },
  });
}
```

## API Service Template

```typescript
// features/{feature}/api/services.ts
import { apiClient } from '@/api/client';
import { {Feature}Schema } from '@/features/{feature}/api/validators';
import { {Feature}Mapper } from '@/features/{feature}/api/mappers';

export async function get{Features}(filters?: any) {
  const response = await apiClient.get('/api/{feature}', { params: filters });
  const normalized = {Feature}Mapper.fromAPI(response.data);
  {Feature}Schema.parse(normalized);
  return normalized;
}

export async function get{Feature}(id: string) {
  const response = await apiClient.get(`/api/{feature}/${id}`);
  return {Feature}Mapper.fromAPI(response.data);
}

export async function update{Feature}(id: string, data: any) {
  const payload = {Feature}Mapper.toAPI(data);
  const response = await apiClient.patch(`/api/{feature}/${id}`, payload);
  return {Feature}Mapper.fromAPI(response.data);
}
```

## Validator Template

```typescript
// features/{feature}/api/validators.ts
import { z } from 'zod';

export const {Feature}Schema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['active', 'inactive']),
  createdAt: z.string().datetime(),
});

export type {Feature} = z.infer<typeof {Feature}Schema>;
```

## Mapper Template

```typescript
// features/{feature}/api/mappers.ts
import { {Feature} } from '@/features/{feature}/api/validators';

interface Raw{Feature} {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export const {Feature}Mapper = {
  fromAPI: (raw: Raw{Feature}): {Feature} => ({
    id: raw.id,
    name: raw.name,
    status: raw.status as any,
    createdAt: raw.created_at,
  }),

  toAPI: (domain: {Feature}): Raw{Feature} => ({
    id: domain.id,
    name: domain.name,
    status: domain.status,
    created_at: domain.createdAt,
  }),
};
```

## Type Template

```typescript
// features/{feature}/types/index.ts
export interface {Feature} {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface {Feature}Filter {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}
```

## Constant Template

```typescript
// features/{feature}/constants/index.ts
export const {FEATURE}_QUERY_KEYS = {
  all: ['{feature}'],
  lists: () => [...{FEATURE}_QUERY_KEYS.all, 'list'],
  list: (filters) => [...{FEATURE}_QUERY_KEYS.lists(), filters],
  details: () => [...{FEATURE}_QUERY_KEYS.all, 'detail'],
  detail: (id) => [...{FEATURE}_QUERY_KEYS.details(), id],
};

export const {FEATURE}_MESSAGES = {
  LOADING: 'Loading {feature}...',
  ERROR: 'Failed to load {feature}',
  SUCCESS: '{Feature} updated successfully',
  NOT_FOUND: '{Feature} not found',
};
```

## Documentation Template

Create a `FEATURE.md` in the feature root:

```markdown
# {Feature} Feature

## Overview

Brief description of what this feature does.

## Architecture

- **Pages:** List smart components
- **Components:** List presentational components
- **State:** How state is managed
- **API:** Endpoints used

## Entity Relationships
```

{Entity1} ←→ {Entity2}
↓
{Entity3}

```

## Permissions
- `{feature}:view` — View {feature}
- `{feature}:edit` — Edit {feature}
- `{feature}:delete` — Delete {feature}

## Events
- `{feature}.created`
- `{feature}.updated`
- `{feature}.deleted`

## Edge Cases
- What if data is empty?
- What if request fails?
- What if user has no permissions?

## Dependencies
- React Query (state management)
- zod (validation)
- react-hook-form (forms)
```

## Checklist Before Shipping

- [ ] All components < 300 lines
- [ ] All imports are absolute (`@/...`)
- [ ] No inline styles
- [ ] Barrel exports created
- [ ] Types defined
- [ ] API service created
- [ ] Hooks created
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Empty states handled
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] Documentation written
- [ ] ESLint passing
- [ ] No console.log left

---

**Use this template for every new feature.**

**No exceptions.**
