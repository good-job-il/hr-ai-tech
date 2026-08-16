# Frontend architecture

The React application uses route-level pages, reusable domain components, typed API services and TanStack Query hooks.

```text
page/component → query hook/domain service → shared HTTP client → NestJS `/api`
```

UI code must not import the shared HTTP client directly. Add explicit query/create/update contracts to the relevant service, keep stable keys in `queryKeys.ts`, and invalidate only affected resources. Authentication tokens are managed by `tokenStorage.ts`; authorization and tenant ownership are enforced by the backend.
