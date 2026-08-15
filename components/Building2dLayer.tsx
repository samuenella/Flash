// Building2dLayer.tsx
import React from "react";
import { Layer } from "@maplibre/maplibre-react-native";

export default function Building2dLayer() {
	return (
		<Layer
			type="fill"
			id="building-2d-overlay"
			source="openmaptiles"
			source-layer="building"
			afterId="building"
			maxzoom={24}
			style={{
				fillColor: "#e1e0e0",
				fillOpacity: 0.85,
			}}
		/>
	);
}
