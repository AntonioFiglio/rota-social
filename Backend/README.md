# Impacto Social API (Mock)

Backend FastAPI em modo totalmente mockado para apoiar protótipos de hackathon na área de ponte de direitos educacionais. Toda a persistência acontece em arquivos JSON residentes em `data/`.

## Requisitos

- Python 3.10+ (testado localmente)
- Sem dependência de Docker ou banco relacional

## Como rodar localmente

```bash
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Docs interativas: http://localhost:8000/docs
```

## Bases de dados (somente JSON)

- Arquivos em `data/*.json` seguem o formato `{ "collection": [...] }` (exceto `config.json`, `zones.json`, `audit_log.jsonl`).
- Seeds iniciais já contemplam alunos, pessoas, famílias, voluntários, relacionamentos, caches de serviços e zonas.
- Auditoria (`audit_log.jsonl`) recebe uma linha JSON por evento (`sync_students`, `webhook_volunteer`, `assign`, `insight_student`, `insight_family` etc.).
- Busca por zonas ignora espaços e diferença de maiúsculas/minúsculas (`sao paulo`, `SaoPaulo`, `SAO PAULO` → "Sao Paulo").

### Gerar seeds volumosas

As seeds em código já preparam **3000 alunos** (mais famílias, responsáveis e voluntários). Para escrever/atualizar os arquivos em `data/` execute:

```bash
python -m app.seed_data --force  # sobrescreve arquivos existentes
```

Sem `--force` apenas cria arquivos ausentes. O processo é determinístico.

## Alternância de comportamento

- `config.json`: valores padrão como `max_students_default`, `max_radius_km`, `min_students_per_zone_after_sync`.
- `OPENAI_API_KEY` (opcional): se definido, `/insights/*` tenta chamar OpenAI; em caso de erro ou ausência da chave, gera fallback mock seguro. Ajuste o modelo via `OPENAI_MODEL` (default `gpt-4o-mini`).

## Endpoints principais (resumo)

- `GET /health` — status simples da API.
- `GET /students?zone=...` — lista perfis completos de alunos.
- `GET /sync/students?zone=...` — gera alunos/guardião/família mock e consulta SUS/CadÚnico/Bolsa Família (mock) para atualizar `FamilyProfile`.
- `GET /volunteers?zone=...` — lista voluntários disponíveis.
- `POST /webhook/volunteers` — cadastra ou atualiza voluntário (payload `VolunteerProfile`).
- `GET /families?zone=...` / `GET /family/{family_id}` — consulta famílias enriquecidas com serviços externos mock.
- `POST /assign` — matching aluno→voluntário por zona + distância (Haversine) + regras de acessibilidade/capacidade.
- `GET /assignments?zone=...` — histórico de atribuições.
- `POST /insights/student` / `POST /insights/family` — gera insight curto (OpenAI opcional, fallback garantido).
- `GET /network/student/{student_id}` — grafo simplificado (aluno, família, pessoas, voluntário atribuído).

## Exemplo rápido de chamadas (`curl`)

```bash
# Sincronizar alunos de São Paulo
curl "http://localhost:8000/sync/students?zone=Sao%20Paulo"

# Registrar voluntário
curl -X POST http://localhost:8000/webhook/volunteers \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Fulano da Silva",
    "zone":"Sao Paulo",
    "address":{"street":"Rua Teste","number":"10","neighborhood":"Centro","city":"São Paulo","state":"SP","postal_code":"01000-000"},
    "contact":{"phone":"+55 11 98888-0000","email":"fulano@example.com","whatsapp_preferred":true},
    "coordinates":{"latitude":-23.55,"longitude":-46.63},
    "availability":{"weekdays":["mon","wed"],"time_slots":["morning"]},
    "skills":["reforço português"],
    "languages":["pt-BR"],
    "experience_years":1,
    "accessibility":{"mobility_assistance":true,"vehicle_type":"car"},
    "tags":["tutor"]
  }'

# Atribuir alunos
curl -X POST http://localhost:8000/assign \
  -H "Content-Type: application/json" \
  -d '{"zone":"Sao Paulo","max_radius_km":6}'

# Insight para aluno
curl -X POST http://localhost:8000/insights/student \
  -H "Content-Type: application/json" \
  -d '{"student_id":"S0001"}'
```

## Notas éticas

- 100% mock — nenhum dado pessoal real.
- Explicabilidade em cada fluxo (campos `explanation`, auditoria e justificativas nos insights/assign).
- Minimização de dados sensíveis e tratamento respeitoso nas mensagens.
- Em produção real seria necessário garantir base legal, consentimento informado (LGPD) e segurança reforçada.

## Troubleshooting

- **OpenAI indisponível** → endpoints `/insights/*` retornam insight mock seguro com pergunta aberta.
- **Dados “sumiram”** → a persistência é feita em JSON; verifique `data/*.json`. Durante a sincronização novos IDs são gerados com prefixos `S`, `P`, `F`, `V`, `E`, `SV`.
- **Capacidade excedida?** → `POST /assign` respeita `max_students` do voluntário e o raio configurado; repetições não superam a carga máxima.
- **Auditoria** → confira `data/audit_log.jsonl` para reconstruir eventos (timestamp ISO8601 UTC).
- **Seeds grandes** → se quiser recomeçar com o dataset de 3000 alunos, delete/backup `data/*.json` e rode `python -m app.seed_data --force`.
