"use client";

import { colorToCss } from "@/lib/utils";
import { Color } from "@/types/canvas";



interface ColorPickerProps {
    onChange: (color: Color) => void;
};

export const ColorPicker = ({
    onChange,
}: ColorPickerProps) => {
    return (
        <div className="flex flex-wrap gap-2 items-center max-w-[164px] pr-2 mr-2 border-r border-neutral-200">
            <ColorButton color={{ r: 243, g: 82, b: 35 }} onClick={onChange} />
            <ColorButton color={{ r: 34, g: 177, b: 76 }} onClick={onChange} />
            <ColorButton color={{ r: 0, g: 162, b: 232 }} onClick={onChange} />
            <ColorButton color={{ r: 163, g: 73, b: 164 }} onClick={onChange} />
            <ColorButton color={{ r: 255, g: 242, b: 0 }} onClick={onChange} />
            <ColorButton color={{ r: 255, g: 127, b: 39 }} onClick={onChange} />
            <ColorButton color={{ r: 255, g: 255, b: 153 }} onClick={onChange} />
            <ColorButton color={{ r: 0, g: 204, b: 204 }} onClick={onChange} />
        </div>
    );
};

interface ColorButtonProps {
    onClick: (color: Color) => void;
    color: Color;
}

const ColorButton =({
    onClick,
    color,
}: ColorButtonProps) => {
    return (
        <button
            className="w-8 h-8 items-center flex justify-center hover:opacity-75 transition"
            onClick={() => onClick(color)}
        >
            <div
                className="h-8 w-8 rounded-md border border-neutral-300"
                style={{ background: colorToCss(color) }}
            />
        </button>
    );
};
