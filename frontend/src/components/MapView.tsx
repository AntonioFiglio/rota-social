import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L, { LatLngExpression } from "leaflet";

import type {
  AssignmentRecord,
  StudentProfile,
  VolunteerProfile,
} from "../types/models";
import haversineKm from "../lib/distance";
import MapLegend from "./MapLegend";
import MapControls from "./MapControls";
import {
  STUDENT_NAME_PLACEHOLDER,
  useStudentNames,
} from "../store/useStudentDirectory";

type MapViewProps = {
  volunteer: VolunteerProfile;
  studentsSuggested?: StudentProfile[];
  studentsAssigned?: Array<{
    student: StudentProfile;
    assignment?: AssignmentRecord;
  }>;
  showRadius?: boolean;
  drawDistanceLines?: boolean;
  onStudentClick?: (studentId: string) => void;
};

const volunteerIcon = L.divIcon({
  html: '<span class="block h-3 w-3 rounded-full bg-primary-500"></span>',
  className: "",
});

const suggestedIcon = L.divIcon({
  html: '<span class="block h-3 w-3 rounded-full bg-warning-500"></span>',
  className: "",
});

const assignedIcon = L.divIcon({
  html: '<span class="block h-3 w-3 rounded-full bg-success-500"></span>',
  className: "",
});

const BoundsUpdater = ({ bounds }: { bounds?: L.LatLngBounds }) => {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds.pad(0.2));
    }
  }, [bounds, map]);
  return null;
};

const MapView = ({
  volunteer,
  studentsSuggested = [],
  studentsAssigned = [],
  showRadius = true,
  drawDistanceLines = true,
  onStudentClick,
}: MapViewProps) => {
  const [visibleSuggested, setVisibleSuggested] = useState(true);
  const [visibleAssigned, setVisibleAssigned] = useState(true);
  const [visibleRadius, setVisibleRadius] = useState(showRadius);
  const [visibleLines, setVisibleLines] = useState(drawDistanceLines);

  const volunteerCoords = volunteer.coordinates;

  const volunteerPosition = useMemo<LatLngExpression | undefined>(() => {
    if (!volunteerCoords) return undefined;
    return [
      volunteerCoords.latitude,
      volunteerCoords.longitude,
    ];
  }, [volunteerCoords]);

  const suggestedMarkers = useMemo(
    () =>
      studentsSuggested
        .filter((student) => student.coordinates)
        .slice(0, 10)
        .map((student) => ({
          id: student.id,
          position: [
            student.coordinates!.latitude,
            student.coordinates!.longitude,
          ] as LatLngExpression,
          student,
        })),
    [studentsSuggested],
  );

  const assignedMarkers = useMemo(
    () =>
      studentsAssigned
        .filter((item) => item.student.coordinates)
        .map((item) => ({
          id: item.student.id,
          position: [
            item.student.coordinates!.latitude,
            item.student.coordinates!.longitude,
          ] as LatLngExpression,
          student: item.student,
          assignment: item.assignment,
        })),
    [studentsAssigned],
  );

  const allStudentIds = useMemo(() => {
    const ids: string[] = [];
    studentsSuggested.forEach((student) => ids.push(student.id));
    studentsAssigned.forEach((item) => ids.push(item.student.id));
    return ids;
  }, [studentsAssigned, studentsSuggested]);

  const studentNamesMap = useStudentNames(allStudentIds);

  const bounds = useMemo(() => {
    const latLngs: LatLngExpression[] = [];
    if (volunteerPosition) latLngs.push(volunteerPosition);
    suggestedMarkers.forEach((marker) => latLngs.push(marker.position));
    assignedMarkers.forEach((marker) => latLngs.push(marker.position));
    if (latLngs.length === 0) return undefined;
    return L.latLngBounds(latLngs);
  }, [volunteerPosition, suggestedMarkers, assignedMarkers]);

  useEffect(() => {
    setVisibleRadius(showRadius);
  }, [showRadius]);

  useEffect(() => {
    setVisibleLines(drawDistanceLines);
  }, [drawDistanceLines]);

  if (!volunteerPosition) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-600">
        Coordenadas do voluntário não disponíveis. Atualize o cadastro para
        habilitar o mapa.
      </div>
    );
  }

  const renderSuggestedMarkers = () =>
    visibleSuggested
      ? suggestedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={suggestedIcon}
            eventHandlers={{
              click: () => onStudentClick?.(marker.student.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-neutral-900">
                  {studentNamesMap[marker.student.id] ?? STUDENT_NAME_PLACEHOLDER}
                </p>
                <p className="text-neutral-600">
                  {marker.student.school.school_name}
                </p>
              </div>
            </Popup>
          </Marker>
        ))
      : null;

  const renderAssignedMarkers = () =>
    visibleAssigned
      ? assignedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={assignedIcon}
            eventHandlers={{
              click: () => onStudentClick?.(marker.student.id),
            }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold text-neutral-900">
                  {studentNamesMap[marker.student.id] ?? STUDENT_NAME_PLACEHOLDER}
                </p>
                <p className="text-neutral-600">
                  {marker.assignment?.distance_km
                    ? `${marker.assignment.distance_km.toFixed(1)} km`
                    : "Distância estimada"}
                </p>
              </div>
            </Popup>
          </Marker>
        ))
      : null;

  const renderLines = () => {
    if (!visibleLines || !volunteer.coordinates) return null;
    const coords = volunteer.coordinates;
    return assignedMarkers.map((marker) => {
      const distance = marker.assignment?.distance_km
        ? marker.assignment.distance_km
        : marker.student.coordinates
        ? haversineKm(coords, marker.student.coordinates)
        : 0;
      return (
        <Polyline
          key={`line-${marker.id}`}
          positions={[volunteerPosition, marker.position]}
          color="#2D3748"
          opacity={0.6}
        >
          <Popup>
            Distância aproximada: {distance.toFixed(1)} km
          </Popup>
        </Polyline>
      );
    });
  };

  return (
    <div className="relative rounded-xl border border-neutral-200 bg-white shadow-sm">
      <MapContainer
        center={volunteerPosition}
        zoom={12}
        style={{ height: 360, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> colaboradores'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsUpdater bounds={bounds} />
        <Marker position={volunteerPosition} icon={volunteerIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold text-neutral-900">{volunteer.name}</p>
              <p className="text-neutral-600">Zona {volunteer.zone}</p>
              <p className="text-neutral-600">
                Raio {volunteer.radius_km.toFixed(1)} km — capacidade {" "}
                {volunteer.max_students}
              </p>
            </div>
          </Popup>
        </Marker>

        {visibleRadius && (
          <Circle
            center={volunteerPosition}
            radius={volunteer.radius_km * 1000}
            pathOptions={{
              color: "#2B6CB0",
              fillColor: "#2B6CB0",
              fillOpacity: 0.1,
            }}
          />
        )}

        <>
          {renderSuggestedMarkers()}
          {renderAssignedMarkers()}
        </>

        {renderLines()}
      </MapContainer>

      <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2">
        <div className="pointer-events-auto">
          <MapLegend />
        </div>
        <div className="pointer-events-auto">
          <MapControls
            showSuggested={visibleSuggested}
            showAssigned={visibleAssigned}
            showRadius={visibleRadius}
            showLines={visibleLines}
            onToggleSuggested={() => setVisibleSuggested((prev) => !prev)}
            onToggleAssigned={() => setVisibleAssigned((prev) => !prev)}
            onToggleRadius={() => setVisibleRadius((prev) => !prev)}
            onToggleLines={() => setVisibleLines((prev) => !prev)}
          />
        </div>
      </div>
    </div>
  );
};

export default MapView;
