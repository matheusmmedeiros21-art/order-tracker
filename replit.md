# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Product

- HelpDesk interno em PT-BR. Apple-style.
- Rotas: `/` landing, `/novo-chamado` formulário, `/anydesk` tutorial, `/admin` (gated `matheusfuza123`/`15224921`, `localStorage.helpdesk_admin_auth`).
- Form aceita ID do AnyDesk e print do erro (comprimido client-side para JPEG ≤ 1600px). Servidor valida `screenshotUrl` como data URL `image/(jpeg|png|webp)`. Body limit Express: 12mb.
- Admin lista chamados por chegada ou prioridade (urgent>high>medium>low, desempate por createdAt asc); badge AnyDesk copiável e modal do print.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Gotchas

- Após `pnpm --filter @workspace/api-spec run codegen`, sempre reescrever `lib/api-zod/src/index.ts` para uma única linha `export * from "./generated/api";` (orval recria com import quebrado de `./generated/api.schemas`).

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
