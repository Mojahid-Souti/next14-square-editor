import { colorToCss } from "@/lib/utils";
import { HexagonLayer } from "@/types/canvas";

interface HexagonProps {
    id: string;
    layer: HexagonLayer;
    onPointerDown: (e: React.PointerEvent, id: string) => void;
    selectionColor?: string;
};

export const Hexagon = ({
    id,
    layer,
    onPointerDown,
    selectionColor,
}: HexagonProps) => {
    const radius = layer.width / 2;
    const centerX = layer.x + radius;
    const centerY = layer.y + layer.height / 2;

    // Generate points for a regular hexagon
    const points = Array.from({ length: 6 }, (_, index) => {
        const angle = Math.PI / 3 * index; // 60 degrees in radians
        return [
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle)
        ].join(',');
    }).join(' ');

    return (
        <polygon
            className="drop-shadow-md"
            onPointerDown={(e) => onPointerDown(e, id)}
            style={{ transform: `translate(0, 0)` }}
            points={points}
            fill={layer.fill ? colorToCss(layer.fill) : "#000"}
            stroke={selectionColor || "transparent"}
            strokeWidth="1"
        />
    );
};
