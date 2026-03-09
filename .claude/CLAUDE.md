# SolBot

A Solana DeFi trading bot built on the Zero Protocol. Implements a 9-rule OTT Trend + RSI-14 strategy for leveraged SOL-perp positions with automated stop-loss, take-profit, and re-entry logic. Dry-run mode by default.

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
