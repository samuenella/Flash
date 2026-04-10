import React from "react";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { FeatureCollection, Geometry, GeoJsonProperties } from "geojson";
import landmarksGeoJSON from "@/constants/landmarksGeoJSON";

export default function LandmarkLayer({
    highlightLandmark,
    landmarkID,
}: {
    highlightLandmark: boolean;
    landmarkID: string;
}) {
    const selected = landmarksGeoJSON.filter((b) => b.id === landmarkID); // DEV TESTING, change back to landmarkID later
    const selectedFeatureCollection: FeatureCollection<
        Geometry,
        GeoJsonProperties
    > = {
        type: "FeatureCollection",
        features: selected ? selected.map((b) => b) : [],
    };

    return (
        <MapLibreGL.ShapeSource
            id="selected-building"
            shape={selectedFeatureCollection}
        >
            <MapLibreGL.FillExtrusionLayer
                id="highlight-building"
                aboveLayerID="building-3d"
                style={{
                    fillExtrusionColor: "#dbad40", // highlight color
                    fillExtrusionHeight: ["get", "render_height"],
                    fillExtrusionBase: ["get", "render_min_height"],
                    fillExtrusionOpacity: highlightLandmark ? 0.7 : 0,
                }}
            />
        </MapLibreGL.ShapeSource>
    );
}
