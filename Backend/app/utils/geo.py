"""Funcoes geograficas simples para calculo de distancia."""

import math


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calcula distancia aproximada em quilometros entre dois pontos."""
    radius = 6371.0
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    delta_lat = lat2_rad - lat1_rad
    delta_lon = lon2_rad - lon1_rad

    a_value = (
        math.sin(delta_lat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    )
    c_value = 2 * math.atan2(math.sqrt(a_value), math.sqrt(max(0.0, 1 - a_value)))
    return round(radius * c_value, 3)


__all__ = ["haversine_km"]
