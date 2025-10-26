# Impacto Social – Guia de Execução Rápida

Este repositório reúne **backend (FastAPI)** e **frontend (React + Vite)** usados na POC do hackathon.  
O objetivo deste documento é facilitar a execução local e lembrar das entregas obrigatórias.

---

## 📁 Estrutura

```
Backend/   # API FastAPI (mock + seeds em JSON)
frontend/  # Portal do Voluntário (React/Vite)
```

---

## 🚀 Passo a Passo de Execução

### 1. Backend (FastAPI)

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# Docs: http://localhost:8000/docs
```

**Seeds volumosas (já com nomes PT-BR):**

```bash
python -m app.seed_data --force
```

> Os arquivos ficam em `Backend/data/*.json`.  
> Variáveis úteis: `OPENAI_API_KEY` (opcional), `OPENAI_MODEL` (`gpt-4o-mini` por padrão).

### 2. Frontend (Portal do Voluntário)

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

> A base da API é configurável via `VITE_API_BASE` (default `http://localhost:8000`).

### 3. Fluxo recomendado (dois terminais)

1. **Terminal A**: subir o backend (`uvicorn app.main:app --reload`).  
2. **Terminal B**: subir o frontend (`npm run dev`).  

O frontend consome diretamente as rotas mock da API (sem passos adicionais).

---

## ✅ Checklist de Submissão (iMasters)

Prazo: **até 13h00 do segundo dia**. Enviar pelo formulário do evento.

1. **Vídeo Demo (YouTube público ou não listado)** máx. 120 segundos, mostrando a solução funcionando (sem protótipo estático).
2. **Apresentação (PDF)** – ~10 slides com problema, solução, stack, roadmap.
3. **Repositórios GitHub (1 a 3 links)** com:
   - README completo (descrição, instruções de uso, licença, nomes/e-mails da equipe).
   - Histórico de commits seguindo boas práticas (ex.: Conventional Commits).
4. **Respeitar limites**: no máximo 5 links no formulário (1 vídeo + 1 PDF + 1-3 repositórios). Vídeo >120s ou links extras → desclassificação.
5. Código será revisado qualitativamente. Projetos sem código próprio podem ser desclassificados.
6. **Pitch presencial**: 3 minutos de apresentação + 3 minutos de perguntas (a partir de 15h00 de 26/10/2025).

> Sugestão: preparar um script de pitch cobrindo problema → solução → demo → impacto → próximos passos.

---

## 📌 Dicas finais

- Ao clonar em outro ambiente, repetir o passo de `python -m app.seed_data --force` para garantir os JSONs.
- Registrar no README dos repositórios finais quem compôs a equipe, tecnologias e instruções de deploy.
- Cronometrar o vídeo e o pitch para não estourar o tempo oficial.

Bom hack! 💪
