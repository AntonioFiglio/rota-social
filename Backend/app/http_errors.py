"""Helpers para padronizar respostas de erro HTTP."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import HTTPException


def http_error(status_code: int, error: str, detail: Optional[Dict[str, Any]] = None) -> HTTPException:
    return HTTPException(
        status_code=status_code,
        detail={
            "error": error,
            "status_code": status_code,
            "detail": detail or {},
        },
    )


__all__ = ["http_error"]
