"""Utilitarios gerais (geo, id, texto)."""

from .geo import haversine_km
from .idgen import next_id
from .strings import normalize_zone_name

__all__ = ["haversine_km", "next_id", "normalize_zone_name"]
