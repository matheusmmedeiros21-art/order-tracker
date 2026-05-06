# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Product

- HelpDesk interno em PT-BR. Apple.com style com **light + dark mode**. Tema gerenciado por `ThemeProvider` (`src/components/theme-provider.tsx`) → classe `light`/`dark` no `<html>`, persistido em `localStorage.helpdesk_theme`, default = `prefers-color-scheme`. Toggle (`ThemeToggle`) na navbar de toda página. Light: bg gradient #fff→#f5f5f7 + glow azul. Dark: bg gradient #000→#0b0b0f + glow azul intensificado. Accents #0071E3 (light) / #0a84ff (dark). Cards glass (`.card-soft` rgba 0.7 light / rgba 0.05 dark + blur 20px saturate 180%). Navbar `.nav-glass` transparente, vira frosted no scroll (rgba 0.6 light / rgba 20,20,20,0.6 dark). Hard-coded literals (`text-[#1d1d1f]`, `text-[#6e6e73]`, `bg-white`, `border-black/[0.06]` etc) têm overrides automáticos em `.dark` via CSS escapado. Tokens em `src/index.css`.
- Hero da landing tem **CinematicShowcase** (`src/pages/landing.tsx`): seção sticky 220vh com mockup de device que escala (0.78→1.06), rotateX (10°→-2°), parallax de blobs azul/roxo em velocidades diferentes, caption fade-in/out — driven por `useScroll` + `useTransform` (cubic-bezier easing). Respeita `prefers-reduced-motion`.
- Rotas: `/` landing, `/novo-chamado` formulário, `/anydesk` tutorial, `/fila` board público em tempo real, `/admin` (gated `matheusfuza123`/`15224921`, `localStorage.helpdesk_admin_auth`).
- Hero do landing tem **input de rastreamento** como CTA principal: usuário digita ID → salva em `localStorage.helpdesk_my_ticket` → navega pra `/fila` (que destaca a linha).
- `/fila` consome `GET /tickets/queue` (público, sem PII além de primeiro nome) com refetch 5s; destaca o chamado próprio via `localStorage.helpdesk_my_ticket` salvo após envio do formulário.
- Form aceita ID do AnyDesk e print do erro (comprimido client-side para JPEG ≤ 1600px). Servidor valida `screenshotUrl` como data URL `image/(jpeg|png|webp)`. Body limit Express: 12mb.
- Admin lista chamados por chegada ou prioridade (urgent>high>medium>low, desempate por createdAt asc); badge AnyDesk copiável e modal do print.
- Tela pós-envio mostra `#ID` grande, posição na fila com polling 6s (`GET /tickets/:id/queue-position`) e dispara `Notification` quando status passa de `pending` → `in_progress`.
- **Fila pública é puro FIFO** (createdAt asc, desempate por id). Prioridade existe só para o admin: não vai nas respostas de `/tickets/queue` nem `/tickets/:id/queue-position`, e não afeta a posição.

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
