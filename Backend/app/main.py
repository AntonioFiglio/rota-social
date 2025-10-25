"""Aplicacao FastAPI para backend mock de impacto social."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .routers import assignments, families, graph, insights, students, volunteers


def _utc_now_iso() -> str:
    return datetime.utcnow().replace(tzinfo=timezone.utc, microsecond=0).isoformat()


app = FastAPI(
    title="Impacto Social API",
    description=(
        "Backend FastAPI mockado para prototipagem de programas educacionais. "
        "Todos os dados são sintéticos, com persistência em arquivos JSON."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(volunteers.router)
app.include_router(families.router)
app.include_router(assignments.router)
app.include_router(insights.router)
app.include_router(graph.router)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    content = {
        "error": "validation_error",
        "status_code": 422,
        "detail": exc.errors(),
    }
    return JSONResponse(status_code=422, content=content)


@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    payload = exc.detail if isinstance(exc.detail, dict) else None
    if not payload:
        payload = {
            "error": "http_error",
            "status_code": exc.status_code,
            "detail": exc.detail,
        }
    return JSONResponse(status_code=exc.status_code, content=payload)


@app.get("/health")
def health() -> dict:
    """Retorna status simples da API."""
    return {"status": "ok", "time": _utc_now_iso()}


__all__ = ["app"]
