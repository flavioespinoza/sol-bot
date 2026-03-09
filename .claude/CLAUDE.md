# Zero TypeScript SDK

Solana DeFi lending protocol SDK — forked from P0, rebranded as Zero.

## Structure

- `src/` — SDK source (models, services, instructions, types, utils)
- `examples/` — Runnable examples
- `tests/` — Unit and integration tests
- `dist/` — Build output (ESM + CJS)

## Key Classes

- `ZeroClient` — Main SDK client (init, banks, oracles)
- `MarginfiAccount` / `MarginfiAccountWrapper` — Lending account operations
- `Bank` — Lending pool model
- `ZeroConfig` — Network configuration

## Commands

```bash
pnpm build        # Build ESM + CJS
pnpm dev          # Watch mode
pnpm test:unit    # Unit tests
pnpm test:integration  # Integration tests (needs RPC)
pnpm lint         # ESLint
pnpm format       # Prettier
pnpm typecheck    # TypeScript check
```
