# EliaHealth

Plataforma de saude EliaHealth — backend NestJS, frontend React, banco PostgreSQL.

## Pre-requisitos

- [Docker](https://www.docker.com/) e Docker Compose
- Node.js 20+ (para desenvolvimento local)

## Como rodar

### 1. Configurar variaveis de ambiente

```bash
cp .env.example .env
# Edite o .env com seus valores reais
```

### 2. Subir com Docker Compose

```bash
docker compose up --build
```

Isso sobe:

| Servico   | URL                    |
| --------- | ---------------------- |
| Frontend  | http://localhost:5173  |
| Backend   | http://localhost:3000  |
| Postgres  | localhost:5432         |

### 3. Desenvolvimento local (sem Docker)

**Backend:**

```bash
cd backend
npm install
npm run start:dev
```

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

## Estrutura do projeto

```
eliahealth/
├── backend/          # API NestJS (TypeScript)
├── frontend/         # App React (TypeScript + Vite)
├── docker-compose.yml
├── .env.example
└── README.md
```
