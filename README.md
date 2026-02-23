# 3D Print Pricer

A full-stack monorepo aplicacion para calcular el costo y un margen de ganancia en impresiones 3d.

## Features

- 📦 **Monorepo** with pnpm workspaces
- 🎨 **React + Vite** frontend with TypeScript
- ⚡ **Fastify** API backend
- 🧮 **Shared core library** with calculation logic
- ✅ **Vitest** for unit testing
- 📊 **Frontend-Backend integration** via proxy

## Tech Stack

- **Monorepo Manager**: pnpm
- **Runtime**: Node.js 20+
- **Frontend**: React 18 + Vite
- **Backend**: Fastify
- **Language**: TypeScript
- **Testing**: Vitest
- **Validation**: Zod

## Project Structure

3d-print-pricer/ 
├── packages/ 
│ └── core/ # Shared business logic 
│ ├── src/ 
│ │ ├── types.ts 
│ │ └── calculateQuote.ts 
│ └── test/ 
├── apps/ 
│ ├── api/ # Fastify API server 
│ │ └── src/ 
│ └── web/ # React + Vite frontend 
│ └── src/ 
└── pnpm-workspace.yaml

## Quick Start

### Prerequisites

- Node.js 20+ (or via WSL on Windows 11)
- pnpm `npm install -g pnpm`

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/3d-print-pricer.git
cd 3d-print-pricer
pnpm setup

### Inicio
pnpm dev
### de forma individual
# Terminal 1: API (port 3001)
pnpm --filter @app/api dev

# Terminal 2: Web (port 5173)
pnpm --filter @app/web dev

# Terminal 3: Core in watch mode
pnpm --filter @app/core dev
### Testing
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @app/core test
pnpm --filter @app/api test
pnpm --filter @app/web test
### Building
# Build all packages
pnpm build

# Build for production
pnpm --filter @app/web build
pnpm --filter @app/api build

#Para correr el proyecto y probarlo
desde el root con 3 terminales
terminal 1
pnpm --filter @app/core dev
terminal 2 
pnpm --filter @app/api dev
terminal 3
pnpm --filter @app/web dev

#si funciona abrir la app en:
http://localhost:5173
http://localhost:5174/quote
