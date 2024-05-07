import { Circle, HexagonIcon, MousePointer2, Pencil, Redo2, Square, StickyNote, Type, Undo2 } from "lucide-react";
import { ToolButton } from "./tool-button";
import { CanvasMode, CanvasState, LayerType } from "@/types/canvas";


interface ToolBarProps {
    CanvasState: CanvasState;
    setCanvasState: (newState: CanvasState) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
};

export const Toolbar = ({
    CanvasState,
    setCanvasState,
    undo,
    redo,
    canUndo,
    canRedo,
}: ToolBarProps) => {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4">
            <div className="bg-white rounded-md p-1.5 flex gap-y-1 flex-col items-center shadow-md">
                <ToolButton 
                    label="Select"
                    icon={MousePointer2}
                    onClick={() => setCanvasState({ mode: CanvasMode.None, })} 
                    isActive={
                        CanvasState.mode === CanvasMode.None || 
                        CanvasState.mode === CanvasMode.Translating || 
                        CanvasState.mode === CanvasMode.SelectionNet || 
                        CanvasState.mode === CanvasMode.Pressing || 
                        CanvasState.mode === CanvasMode.Resizing
                    } 
                    isDisabled={false}                
                />
                <ToolButton 
                    label="Text"
                    icon={Type}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: LayerType.Text
                    })} 
                    isActive={
                        CanvasState.mode === CanvasMode.Inserting && 
                        CanvasState.layerType === LayerType.Text
                    } 
                    isDisabled={false}                
                />
                <ToolButton 
                    label="Note"
                    icon={StickyNote}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: LayerType.Note
                    })}
                    isActive={
                        CanvasState.mode === CanvasMode.Inserting && 
                        CanvasState.layerType === LayerType.Note
                    }  
                    isDisabled={false}                
                />
                <ToolButton 
                    label="Rectangle"
                    icon={Square}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: LayerType.Rectangle
                    })} 
                    isActive={
                        CanvasState.mode === CanvasMode.Inserting && 
                        CanvasState.layerType === LayerType.Rectangle
                    }  
                    isDisabled={false}                
                />
                <ToolButton 
                    label="Circle"
                    icon={Circle}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: LayerType.Ellipse
                    })} 
                    isActive={
                        CanvasState.mode === CanvasMode.Inserting && 
                        CanvasState.layerType === LayerType.Ellipse
                    }  
                    isDisabled={false}                
                />
                <ToolButton 
                    label="Hexagon"
                    icon={HexagonIcon}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Inserting, 
                        layerType: LayerType.Hexagon
                    })} 
                    isActive={
                        CanvasState.mode === CanvasMode.Inserting && 
                        CanvasState.layerType === LayerType.Hexagon
                    }  
                    isDisabled={false}                
                />
                <ToolButton 
                    label="Pen"
                    icon={Pencil}
                    onClick={() => setCanvasState({ 
                        mode: CanvasMode.Pencil, 
                    })} 
                    isActive={
                        CanvasState.mode === CanvasMode.Pencil
                    }  
                    isDisabled={false}                
                />
            </div>
            <div className="bg-white rounded-md p-1.5 flex flex-col items-center shadow-md">
                <ToolButton 
                        label="Undo"
                        icon={Undo2}
                        onClick={undo} 
                        isActive={false} 
                        isDisabled={!canUndo}                
                />
                <ToolButton 
                        label="Redo"
                        icon={Redo2}
                        onClick={redo} 
                        isActive={false} 
                        isDisabled={!canRedo}                
                />
            </div>
        </div>
        
    );
};

export const ToolbarSkeleton = () => {
    return (
        <div className="absolute top-[50%] -translate-y-[50%] left-2 flex flex-col gap-y-4 bg-white h-[400px] w-[52px] shadow-md animate-pulse rounded-md" />
    );
};
