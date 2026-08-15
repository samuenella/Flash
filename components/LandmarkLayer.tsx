// LandmarkLayer.tsx
import React from "react";
import { Layer, GeoJSONSource } from "@maplibre/maplibre-react-native";
import { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import landmarksGeoJSON from "@/constants/landmarksGeoJSON";

export default function LandmarkLayer({
	highlightLandmark,
	landmarkID,
}: {
	highlightLandmark: boolean;
	landmarkID: string;
}) {
	const selected = landmarksGeoJSON.filter((b) => b.id === landmarkID);
	const selectedFeatureCollection: FeatureCollection<
		Geometry,
		GeoJsonProperties
	> = {
		type: "FeatureCollection",
		features: selected ? selected.map((b) => b) : [],
	};

	return (
		<GeoJSONSource id="selected-building" data={selectedFeatureCollection}>
			<Layer
				type="fill-extrusion"
				id="highlight-building"
				afterId="building-3d"
				style={{
					fillExtrusionColor: "#dbad40", // highlight color
					fillExtrusionHeight: ["get", "render_height"],
					fillExtrusionBase: ["get", "render_min_height"],
					fillExtrusionOpacity: highlightLandmark ? 0.7 : 0,
				}}
			/>
		</GeoJSONSource>
	);
}
