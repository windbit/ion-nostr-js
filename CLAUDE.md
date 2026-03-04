# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Fork of [nostr-tools](https://github.com/nbd-wtf/nostr-tools) — a TypeScript SDK for the Nostr protocol. Extended with ICIP (ION Connect Implementation Possibilities) modules for the ION blockchain ecosystem.

Published as `@windbit/ion-nostr-js` to both JSR and npm.

## Commands

```bash
bun install              # Install dependencies
just build               # Clean build: rm -rf lib && bun run build.js && tsc
just test                # Run all tests (20s timeout)
just test-only nip19.test.ts  # Run a single test file
just format              # Fix lint + format (eslint --fix + prettier --write)
just lint                # Check lint + format (CI runs this)
just benchmark           # Run benchmarks across deno/node/bun
```

Direct bun test commands also work: `bun test`, `bun test core.test.ts`.

## Code Style

- No semicolons, single quotes, trailing commas, 120 char line width (`.prettierrc.yaml`)
- Arrow parens: avoid (`x => x`, not `(x) => x`)
- ESLint with `@typescript-eslint` parser, extends Prettier
- Unused vars prefixed with `_` are allowed

## Architecture

**Flat module structure** — all source `.ts` files live in the project root. No `src/` directory.

**Core layer:**
- `core.ts` — Type definitions: `Event`, `EventTemplate`, `VerifiedEvent`, `verifiedSymbol`
- `pure.ts` — Pure JS crypto using `@noble/curves/secp256k1` (key generation, signing, verification)
- `kinds.ts` — Event kind classification (regular, replaceable, ephemeral, addressable)
- `filter.ts` — Relay subscription filter types
- `utils.ts` — URL normalization, binary search, UTF-8 encoding

**Relay layer:**
- `abstract-relay.ts` → `relay.ts` — WebSocket relay connection with auto-reconnect and subscriptions
- `abstract-pool.ts` → `pool.ts` — `SimplePool` manages multiple relay connections (query, subscribe, publish)

**NIP modules** (`nip04.ts` through `nip99.ts`) — Each implements a specific Nostr standard (encryption, key encoding, zaps, etc.)

**ICIP modules** (`icip01.ts` through `icip11000.ts`, `icip-dvm.ts`) — ION Connect Protocol extensions to Nostr. Details below.

**Entry point:** `index.ts` re-exports everything. Individual modules are also importable via package.json conditional exports (e.g., `@windbit/ion-nostr-js/pure`, `@windbit/ion-nostr-js/nip19`, `@windbit/ion-nostr-js/icip01`).

## Build Output

`build.js` uses esbuild to produce three formats in `lib/`:
- `lib/esm/` — ES modules
- `lib/cjs/` — CommonJS (auto-generates `package.json` with `"type": "commonjs"`)
- `lib/nostr.bundle.js` — IIFE browser bundle
- `lib/types/` — TypeScript declarations (via `tsc`)

## Testing Patterns

Tests use `bun:test` (`import { test, expect, describe } from 'bun:test'`). Test files are colocated with source: `nip19.ts` → `nip19.test.ts`. Helper utilities in `test-helpers.ts`.

## Crypto

Two implementations behind the same `Nostr` abstract interface:
- **Default (pure.ts):** `@noble/curves/secp256k1` — pure JavaScript
- **Optional WASM:** `nostr-wasm` — ~7x faster libsecp256k1 wrapper

### @noble/curves v2 API Notes
- `sign()` returns `Uint8Array`, not an object with `.toDERHex()`. Use `{ format: 'der' }` option for DER encoding
- `randomPrivateKey()` renamed to `randomSecretKey()` across all curves
- `p256` (secp256r1) is exported from `@noble/curves/nist.js`, NOT `@noble/curves/p256.js`
- ECDSA verify with x-only (Nostr-style) pubkey: must try both `02` and `03` prefix since Y parity is lost
- ed448 pubkeys are 57 bytes (114 hex) — doesn't fit Nostr's 32-byte pubkey field, so curve448 support is limited to raw crypto operations

---

## ION Connect Protocol (ICIP) Modules

### What is ION Connect

ION Connect is an extension of the Nostr protocol used by the [ice-blockchain](https://github.com/ice-blockchain) ecosystem. It adds 20+ ICIPs (ION Connect Implementation Possibilities) on top of standard NIPs for communities, tokenized content, multi-signature events, delegated publishing, and more.

### Specifications

All ICIP specs live in the [subzero](https://github.com/ice-blockchain/subzero) relay repository:
- **Main specs:** [`/.ion-connect-protocol/ICIP-*.md`](https://github.com/ice-blockchain/subzero/tree/master/.ion-connect-protocol)
- **DVM extensions:** [`/.ion-connect-protocol/dvm/ICIP-51*.md`](https://github.com/ice-blockchain/subzero/tree/master/.ion-connect-protocol/dvm)
- **Go event model:** [`/model/model.go`](https://github.com/ice-blockchain/subzero/blob/master/model/model.go) — canonical kind numbers, tag names, and constants

### Reference Implementations in Other Languages

| Language | Repository | Notes |
|----------|-----------|-------|
| **Go** (relay) | [ice-blockchain/subzero](https://github.com/ice-blockchain/subzero) | Server-side ION Connect relay, model definitions |
| **Dart** (app) | [ice-blockchain/ion-framework](https://github.com/ice-blockchain/ion-framework/tree/master/lib/app/features/ion_connect) | Flutter client implementation |
| **Dart** (NIP-44) | [ice-blockchain/dart-nip44](https://github.com/ice-blockchain/dart-nip44/tree/master/lib/src) | Reference impl for ICIP-44 (compression + NIP-44) |
| **Swift** (iOS) | [ice-blockchain/nostr-sdk-ios](https://github.com/ice-blockchain/nostr-sdk-ios/tree/master/Sources/NostrSDK) | Partial ICIP-44 (decompress only) |
| **Go** (Nostr lib) | [ice-blockchain/go-nostr](https://github.com/ice-blockchain/go-nostr) | Minimal extensions: NIP-42 URL matcher, WebSocket deflate |

### ICIP Module Map

#### Foundation (Phase 1)

| Module | ICIP | Kinds | Description |
|--------|------|-------|-------------|
| `kinds.ts` | all | 30 new kinds | ION event kind constants (1175–57103) |
| `icip1000.ts` | [ICIP-1000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-1000.md) | — | Multi-signature: schnorr/ecdsa/eddsa on secp256k1/secp256r1/curve25519/curve448. Wrapper approach — does NOT modify `pure.ts` |
| `icip2000.ts` | [ICIP-2000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-2000.md) | 10100 | On-behalf-of sub-key delegation: attestation lists, `b` tag, kind restrictions |

#### NIP Extensions (Phase 2)

| Module | ICIP | Extends | Kinds | Description |
|--------|------|---------|-------|-------------|
| `icip01.ts` | [ICIP-01](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-01.md) | NIP-01 | 30175, 57103, 21750 | Modifiable notes, stories, Q-tag quotes, extended profile, ephemeral embed |
| `icip11.ts` | [ICIP-11](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-11.md) | NIP-11 | — | Relay info: system_metrics, system_status, FCM configs |
| `icip17.ts` | [ICIP-17](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-17.md) | NIP-17 | 30014, 1757, 2175, 3175 | Modifiable DM, block/archive/mute (all as NIP-59 rumors) |
| `icip44.ts` | [ICIP-44](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-44.md) | NIP-44 | — | Brotli/zlib compression before NIP-44 encryption. Uses `fflate` dep |
| `icip51.ts` | [ICIP-51](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-51.md) | NIP-51 | 11750 | Chats list (E2EE chats + communities) |
| `icip94.ts` | [ICIP-94](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-94.md) | NIP-94 | — | File metadata: `duration` tag, `encryption-key` tag |

#### Independent ICIPs (Phase 3)

| Module | ICIP | Kinds | Description |
|--------|------|-------|-------------|
| `icip3000.ts` | [ICIP-3000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-3000.md) | 31750, 1750–1753 | Communities: definition, join, transfer, ban, update patches. UUIDv7 `h` tag |
| `icip4000.ts` | [ICIP-4000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-4000.md) | — | Event settings tag: comments_enabled, role_required_for_posting, who_can_reply |
| `icip5000.ts` | [ICIP-5000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-5000.md) | 1754 | Poll & vote: `poll` tag on messages, vote events |
| `icip6000.ts` | [ICIP-6000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-6000.md) | 1755, 1756 | Blockchain assets: request funds, send notify. NIP-59 recommended |
| `icip7000.ts` | [ICIP-7000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-7000.md) | — | Rich text: `rich_text` tag with Quill Delta format |
| `icip7001.ts` | [ICIP-7001](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-7001.md) | — | PMO: positional markdown override for kind 1 content |
| `icip8000.ts` | [ICIP-8000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-8000.md) | 31751 | Push notifications: FCM device registration, NIP-44 encrypted token |
| `icip9000.ts` | [ICIP-9000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-9000.md) | 1758 | Fiat payment proof (signed by trusted entity) |
| `icip2001.ts` | [ICIP-2001](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-2001.md) | 1759 | Affiliated users: many-to-many master-delegate relationships |
| `icip10000.ts` | [ICIP-10000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-10000.md) | 21750 | Nostr compatibility: dual-publish ION + pure Nostr via ephemeral embed |
| `icip11000.ts` | [ICIP-11000](https://github.com/ice-blockchain/subzero/blob/master/.ion-connect-protocol/ICIP-11000.md) | 31175, 1175, 4175 | Tokenized communities: token definition, action notification, consent |
| `icip-dvm.ts` | [ICIP-5175–5178](https://github.com/ice-blockchain/subzero/tree/master/.ion-connect-protocol/dvm) | 5175–5178, 6175–6178 | DVM: hashtag stats, price changes, token stats, buying activity |

### Key Differences from Standard Nostr

| Area | Standard Nostr | ION Connect |
|------|---------------|-------------|
| **Signatures** | schnorr/secp256k1 only | Multi-algo via sig prefix: `ecdsa:`, `eddsa:`, `ecdsa/secp256r1:` etc. (ICIP-1000) |
| **Key delegation** | NIP-26 (time-bound, no revocation) | On-behalf-of with attestation list, revocation, kind restrictions (ICIP-2000) |
| **Notes** | Immutable kind 1 | Modifiable kind 30175 with `editing_ended_at` deadline (ICIP-01) |
| **DMs** | Immutable kind 14 | Modifiable kind 30014 + block/archive/mute rumor events (ICIP-17) |
| **Encryption** | NIP-44 only | NIP-44 + brotli/zlib compression layer (ICIP-44) |
| **Communities** | NIP-72 (kind 34550) | Full lifecycle with roles, banning, transfers (ICIP-3000, kinds 31750/1750–1753) |
| **Polls** | NIP-1068 (kind 1068) | `poll` tag on any message event + kind 1754 vote (ICIP-5000) |
| **Profiles** | name, about, picture | + location, category, wallets, NFT collections, privacy settings (ICIP-01) |
| **Push** | Not standardized | FCM-based with encrypted tokens and subscription filters (ICIP-8000) |
| **Rich text** | Markdown convention | Mandatory `rich_text` tag with Quill Delta (ICIP-7000) |
| **Tokenization** | Not present | Token definitions, actions, consent (ICIP-11000) |
| **Nostr compat** | N/A | Dual-publish via kind 21750 ephemeral embed (ICIP-10000) |

### ION Event Kinds Added to `kinds.ts`

```
Regular (< 10000): 1175, 1750–1759, 2175, 3175, 4175, 5175–5178, 6175–6178, 6400
Replaceable (10000–19999): 10100, 11750
Ephemeral (20000–29999): 20002, 21750
Addressable (30000–39999): 30014, 30175, 31175, 31750, 31751
Unknown (>= 40000): 57103 (StoryNote)
```

### Dependency Graph

```
kinds.ts ──┬── icip1000 ──┬── icip2000 ──┬── icip51, icip2001, icip10000, icip11000
           ├── icip01 ────┼── icip3000
           ├── icip11 ────┘── icip8000
           ├── icip17
           ├── icip44 (+ fflate dep)
           ├── icip94
           ├── icip4000, icip5000, icip6000
           ├── icip7000, icip7001
           ├── icip9000
           └── icip-dvm
```
