"""Geracao deterministica de IDs alfanumericos."""

from typing import Iterable


def _parse_numeric(identifier: str, prefix: str) -> int:
    if identifier.startswith(prefix):
        try:
            return int(identifier[len(prefix) :])
        except ValueError:
            return 0
    return 0


def next_id(prefix: str, existing_ids: Iterable[str]) -> str:
    """Retorna proximo ID com zero padding (ex: prefix= S -> S0004)."""
    highest = 0
    for identifier in existing_ids:
        highest = max(highest, _parse_numeric(identifier, prefix))
    return f"{prefix}{highest + 1:04d}"


__all__ = ["next_id"]
