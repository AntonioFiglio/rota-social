# Rota Social (Frontend)

Interface React + Vite dedicada ao voluntário para consumir o backend FastAPI do projeto impacto social.

## Stack

- React 18 + Vite (TypeScript)
- Tailwind CSS (tokens institucionais)
- React Router, TanStack Query, Zustand
- Axios, Day.js, clsx
- React Leaflet (+ Marker Cluster opcional)
- react-virtual para listas extensas

## Instalação

```bash
# criar projeto (caso ainda não tenha rodado este repositório)
npm create vite@latest rotasocial-voluntario -- --template react-ts
cd rotasocial-voluntario

# dependências
npm i axios @tanstack/react-query react-router-dom zustand clsx dayjs
npm i -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# mapa
npm i react-leaflet leaflet

# rodar
npm run dev
# http://localhost:5173
```

Para este repositório, as configurações e arquivos necessários já estão preparados na pasta `src/`.

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do frontend:

```
VITE_API_BASE=http://localhost:8000
```

O valor default aponta para o backend FastAPI local.

## Scripts

```bash
npm run dev      # ambiente de desenvolvimento
npm run build    # build produção
npm run preview  # preview do build
npm run lint     # lint (ESLint + TypeScript)
```

## Estrutura

```
src/
  components/        # UI reutilizável (mapa, cards, layouts)
  domain/            # engine de sugestões (máx. 10 por vez)
  lib/               # axios, TanStack Query, utilidades
  pages/             # telas Onboarding, Overview, Cases, Search, StudentDetails
  store/             # Zustand (voluntário + chamados locais)
  types/             # DTOs espelhando o backend
  styles/            # Tailwind base
```

## Fluxo principal

1. Onboarding (`/onboarding`): selecionar voluntário via `GET /volunteers?zone=...` (persistência local).
2. Dashboard (`/dashboard`):
   - Sugestões (máx. 10) com engine local (`domain/suggestions.ts`).
   - Capacidade (até 10 chamados ativos) e mapa React-Leaflet.
   - Ferramentas rápidas para `GET /sync/students` e `POST /assign`.
3. Meus Chamados (`/cases`): timeline local e controle de status por caso.
4. Busca (`/search`): filtros, lista virtualizada e mapa sincronizado; respeita limite de 10 chamados.
5. Detalhe do aluno (`/students/:id`): abas (Perfil, Família & Serviços, Rede) + geração de insights (`/insights/student`, `/insights/family`).

## Boas práticas implementadas

- Paleta institucional aplicada (#2B6CB0, #48BB78, #ECC94B, #EDF2F7, #2D3748).
- Texto respeitoso e explicável; insights sempre com pergunta aberta.
- Acessibilidade: `focus-visible`, contraste AA, sem diagnósticos.
- TanStack Query com cache (30s) e prefetch leve para famílias.
- Estado local (Zustand) com persistência controlada (`localStorage`).
- Sugestões e listas limitadas a 10 registros relevantes.
- MapView com radius, linhas e legendas conforme especificação.

## Integração com backend

Endpoints utilizados:

- `GET /volunteers?zone=...`
- `GET /students?zone=...`
- `GET /assignments?zone=...`
- `GET /sync/students?zone=...`
- `POST /assign`
- `POST /insights/student`
- `POST /insights/family`
- `GET /family/{family_id}`
- `GET /network/student/{student_id}`

## Transparência

O rodapé fixo reforça que a POC usa dados sintéticos e que todas as decisões são validadas por pessoas. Mantivemos logs locais nos chamados para facilitar accountability.
