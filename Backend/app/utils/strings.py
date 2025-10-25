"""Funcoes auxiliares para manipular textos."""

from __future__ import annotations


def normalize_zone_name(zone: str) -> str:
    """Remove espacos e aplica lower para comparar zonas."""
    return "".join(zone.split()).lower()


__all__ = ["normalize_zone_name"]
