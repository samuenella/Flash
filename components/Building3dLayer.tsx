import React from "react";
import MapLibreGL from "@maplibre/maplibre-react-native";

export default function Building3dLayer({
    highlightLandmark,
}: {
    highlightLandmark: boolean;
}) {
    return (
        <MapLibreGL.FillExtrusionLayer
            id="building-3d"
            sourceID="openmaptiles"
            sourceLayerID="building"
            style={{
                fillExtrusionColor: "#e1e0e0",
                fillExtrusionHeight: ["get", "render_height"],
                fillExtrusionBase: ["get", "render_min_height"],
                fillExtrusionOpacity: highlightLandmark ? 0 : 0.7,
            }}
        />
    );
}
