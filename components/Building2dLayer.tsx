import React from "react";
import MapLibreGL from "@maplibre/maplibre-react-native";

export default function Building2dLayer() {
    return (
        <MapLibreGL.FillLayer
            id="building-2d-overlay"
            sourceID="openmaptiles"
            sourceLayerID="building"
            aboveLayerID="building"
            maxZoomLevel={24}
            style={{
                fillColor: "#e1e0e0",
                fillOpacity: 0.85,
            }}
        />
    );
}
