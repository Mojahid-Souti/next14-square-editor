"use client";

import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";

import { useCallback, useMemo, useState, useEffect } from "react";
import { Camera, CanvasMode, CanvasState, Color, LayerType, Point, Side, XYWH } from "@/types/canvas";
import { 
    useCanRedo, 
    useCanUndo, 
    useHistory,
    useMutation,
    useOthersMapped,
    useSelf,
    useStorage,
} from "@/liveblocks.config";
import { CursorsPresence } from "./cursors-presence";
import { colorToCss, connectionIdToColor, findIntersectingLayersWithRectangle, penPointsToPathLayer, pointerEventToCanvasPoint, resizeBounds } from "@/lib/utils";
import { nanoid } from "nanoid";
import { LiveObject } from "@liveblocks/client";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";

const MAX_LAYERS = 100;


interface CanvasProps {
    boardId: string;
};

export const Canvas = ({
    boardId,
}: CanvasProps) => {
    const layerIds = useStorage((root) => root.layerIds);

    const pencilDraft = useSelf((me) => me.presence.pencilDraft);

    const [CanvasState, setCanvasState] = useState<CanvasState>({
        mode: CanvasMode.None,
    });

    const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });

    const [lastUsedColor, setLastUsedColor] = useState<Color>({
        r: 0,
        g: 0,
        b: 0,
    });


    useDisableScrollBounce();

    const history = useHistory();
    const canUndo = useCanUndo();
    const canRedo = useCanRedo();

    const insertLayer = useMutation((
        { storage, setMyPresence },
        LayerType: LayerType.Ellipse | LayerType.Hexagon | LayerType.Note | LayerType.Rectangle | LayerType.Text,
        position: Point,
    ) => {
        const liveLayers = storage.get("layers");
        if (liveLayers.size >= MAX_LAYERS) {
            return;
        }

        const liveLayerIds = storage.get("layerIds");
        const layerId = nanoid();
        const layer = new LiveObject({
            type: LayerType,
            x: position.x,
            y: position.y,
            height: 100,
            width: 100,
            fill: lastUsedColor,
        });

        liveLayerIds.push(layerId);
        liveLayers.set(layerId, layer);
        setMyPresence({ selection: [layerId] }, { addToHistory: true });
        setCanvasState({ mode: CanvasMode.None });
    }, [lastUsedColor]);

    const translateSelectedLayers = useMutation((
        { storage, self},
        point: Point,
    ) => {
        if (CanvasState.mode !== CanvasMode.Translating) {
            return;
        }

        const offset = {
            x: 0,
            y: 0,
        };
        
        if (CanvasState.current) {
            offset.x = point.x - CanvasState.current.x;
            offset.y = point.y - CanvasState.current.y;
        }
        

        const liveLayers = storage.get("layers")

        for (const id of self.presence.selection) {
            const layer = liveLayers.get(id);

            if (layer) {
                layer.update({
                    x: layer.get("x") + offset.x,
                    y: layer.get("y") + offset.y,
                });
            }
        }
        setCanvasState({
            mode: CanvasMode.Translating,
            current: point
        });
    }, [CanvasState]);

    const unselectLayer = useMutation((
        { self, setMyPresence}
    ) => {
        if (self.presence.selection.length > 0) {
            setMyPresence({ selection: [] }, { addToHistory: true });
        }
    }, []);

    const updateSelectionNet = useMutation((
        { storage, setMyPresence }, 
        current: Point, origin: Point) => {
        const layers = storage.get("layers").toImmutable();
        setCanvasState({
            mode: CanvasMode.SelectionNet,
            origin,
            current,
        });

        const ids = findIntersectingLayersWithRectangle(
            layerIds,
            layers,
            origin,
            current,
        );

        setMyPresence({ selection: ids });

    }, [layerIds]);
    
    const startMultiSelection = useCallback((
        current: Point,
        origin: Point,
    ) => {
        if (
            Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5
        ) {
            setCanvasState({
                mode: CanvasMode.SelectionNet,
                origin,
                current,
            });
        }
    }, []);
    
    const continueDrawing = useMutation((
        { self, setMyPresence },
        point: Point,
        e: React.PointerEvent,
    ) => {
        const { pencilDraft } = self.presence;
      
        if (CanvasState.mode !== CanvasMode.Pencil || e.buttons !== 1 || pencilDraft === null) {
          return;
        }

        setMyPresence({
            cursor: point,
            pencilDraft:
              pencilDraft.length === 1 &&
              pencilDraft[0][0] === point.x &&
              pencilDraft[0][1] === point.y
              ? pencilDraft
              : [...pencilDraft, [point.x, point.y, e.pressure]],
          });
          
      }, [CanvasState.mode]);
      
    const insertPath = useMutation((
    { storage, self, setMyPresence }
    ) => {
    const liveLayers = storage.get("layers");
    const { pencilDraft } = self.presence;
    
    if (
        pencilDraft === null ||
        pencilDraft.length < 2 ||
        liveLayers.size >= MAX_LAYERS
    ) {
        setMyPresence({ pencilDraft: null });
        return;
    }

    const id = nanoid();
    liveLayers.set(
        id,
        new LiveObject(penPointsToPathLayer(
            pencilDraft,
            lastUsedColor,
        )),
    );

    const liveLayerIds = storage.get("layerIds");
    liveLayerIds.push(id);

    setMyPresence({ pencilDraft: null });
    setCanvasState({ mode: CanvasMode.Pencil });

    }, [lastUsedColor]);
      
    
    const startDrawing = useMutation((
        { setMyPresence },
        point: Point,
        pressure: number,
    ) => {
        setMyPresence({
          pencilDraft: [[point.x, point.y, pressure]],
          penColor: lastUsedColor,
        })
      }, [lastUsedColor]);
      

    const resizeSelectedLayer = useMutation((
        { storage, self },
        point: Point,
    ) => {
        if (CanvasState.mode !== CanvasMode.Resizing) {
            return;
        }

        const bounds = resizeBounds(
            CanvasState.initialBounds,
            CanvasState.corner,
            point,
        );

        const liveLayers = storage.get("layers");
        const layer = liveLayers.get(self.presence.selection[0]);

        if (layer) {
            layer.update(bounds);
        };
    }, [CanvasState]);
     

    const onResizeHandlePointerDown = useCallback((
        corner: Side,
        initialBounds: XYWH,
    ) => {
        history.pause();
        setCanvasState({
            mode: CanvasMode.Resizing,
            initialBounds,
            corner,
        });
    },[history]);  

    const onWheel = useCallback((e: React.WheelEvent) => {
        setCamera((camera) => ({
            x: camera.x - e.deltaX,
            y: camera.y - e.deltaY,
        }));
    }, []);

    const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
        e.preventDefault();

        const current = pointerEventToCanvasPoint(e, camera);

        if (CanvasState.mode === CanvasMode.Pressing) {
            startMultiSelection(current, CanvasState.origin);
        } else if (CanvasState.mode === CanvasMode.SelectionNet) {
            updateSelectionNet(current, CanvasState.origin);
        } else if (CanvasState.mode === CanvasMode.Translating) {
            translateSelectedLayers(current);
        } else if (CanvasState.mode === CanvasMode.Resizing) {
            resizeSelectedLayer(current);
        } else if (CanvasState.mode === CanvasMode.Pencil) {
            continueDrawing(current, e);
        }

        setMyPresence({ cursor: current });

    }, [CanvasState, resizeSelectedLayer, camera, continueDrawing, translateSelectedLayers, startMultiSelection, updateSelectionNet]);
    
    const onPointerLeave = useMutation((
        { setMyPresence }
    ) => {
        setMyPresence({ cursor: null });
    }, []);


    const onPointerDown = useCallback((e: React.PointerEvent, ) => {
        const point = pointerEventToCanvasPoint(e, camera);
    
        if (CanvasState.mode === CanvasMode.Inserting) {
            return;
        }
    
        if (CanvasState.mode === CanvasMode.Pencil) {
            startDrawing(point, e.pressure);
            return;
        }
    
        setCanvasState({ origin: point, mode: CanvasMode.Pressing });
    }, [camera, CanvasState.mode, setCanvasState, startDrawing,]);
    
    const onPointerUp = useMutation((
        {},
        e
    ) => {
        const point = pointerEventToCanvasPoint(e, camera);

        if ( CanvasState.mode === CanvasMode.None || CanvasState.mode === CanvasMode.Pressing) {
            unselectLayer();
            
            setCanvasState({
                mode: CanvasMode.None,
            });
        } 
        else if (CanvasState.mode === CanvasMode.Pencil) {
            insertPath();
        }
        else if (CanvasState.mode === CanvasMode.Inserting) {
            insertLayer(CanvasState.layerType, point);
        } 
        else {
            setCanvasState({
                mode: CanvasMode.None,
            });
        }
        history.resume();
    }, [
        setCanvasState,
        camera,
        CanvasState,
        history,
        insertLayer,
        translateSelectedLayers,
        unselectLayer,
        insertPath,
    ]);

    const onLayerPointerDown = useMutation((
        { self, setMyPresence },
        e: React.PointerEvent,
        layerId: string,
    ) => {
        if (
            CanvasState.mode === CanvasMode.Pencil ||
            CanvasState.mode === CanvasMode.Inserting
        ) {
            return;
        }

        history.pause();
        e.stopPropagation();
        const point = pointerEventToCanvasPoint(e, camera);

        if (!self.presence.selection.includes(layerId)) {
            setMyPresence({ selection: [layerId] }, { addToHistory: true });
        }
        setCanvasState({ mode: CanvasMode.Translating, current: point });
        

    }, [
        setCanvasState,
        camera,
        history,
        CanvasState.mode,
    ]);
    

    const selections = useOthersMapped((other) => other.presence.selection);
    const layerIdsToColorSelection = useMemo(() => {
        const layerIdsToColorSelection: Record<string, string> = {};

        for (const user of selections) {
            const [connectionId, selection] = user;

            for (const layerId of selection) {
                layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId);
            }
        }

        return layerIdsToColorSelection;
    }, [selections]);
    
    const deleteLayers = useDeleteLayers();
    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
          switch (e.key) {
            case "z": {
              if (e.ctrlKey || e.metaKey) {
                if (e.shiftKey) {
                  history.redo();
                } else {
                  history.undo();
                }
              }
              break;
            }
          }
        }
      
        document.addEventListener("keydown", onKeyDown);

        return () => {
            document.removeEventListener("keydown", onKeyDown);
        }

      }, [deleteLayers, history]);
      
    return (
        <main className=" h-full w-full relative bg-neutral-100">
            <Info boardId={boardId}/>
            <Participants />
            <Toolbar 
                CanvasState={CanvasState}
                setCanvasState={setCanvasState}
                canRedo={canRedo}
                canUndo={canUndo}
                undo={history.undo}
                redo={history.redo}
            />
            <SelectionTools 
                camera={camera}
                setLastUsedColor={setLastUsedColor}
            />
            
            <svg
                className="h-[100vh] w-[100vw]"
                onWheel={onWheel}
                onPointerMove={onPointerMove}
                onPointerLeave={onPointerLeave}
                onPointerDown={onPointerDown}
                onPointerUp={onPointerUp}
            >
                <g 
                    style={{
                        transform: `translate(${camera.x}px, ${camera.y}px)`
                    }}
                >
                    {layerIds.map((layerId) => (
                        <LayerPreview 
                            key={layerId}
                            id={layerId}
                            onLayerPointerDown={onLayerPointerDown}
                            selectionColor={layerIdsToColorSelection[layerId]}
                        />
                    ))}
                    <SelectionBox 
                        onResizeHandlePointerDown={onResizeHandlePointerDown}
                    />
                    {CanvasState.mode === CanvasMode.SelectionNet && CanvasState.current != null && (
                        <rect 
                            className="fill-blue-500/5 stroke-blue-500 stroke-1"
                            x={Math.min(CanvasState.origin.x, CanvasState.current.x)}
                            y={Math.min(CanvasState.origin.y, CanvasState.current.y)}
                            width={Math.abs(CanvasState.origin.x - CanvasState.current.x)}
                            height={Math.abs(CanvasState.origin.y - CanvasState.current.y)}
                        />
                    )}
                    <CursorsPresence />
                    {pencilDraft != null && pencilDraft.length > 0 && (
                        <Path 
                            points={pencilDraft}
                            fill={colorToCss(lastUsedColor)}
                            x={0}
                            y={0} 
                            onPointerDown={onPointerDown}                          
                        />
                    )}
                </g>
            </svg>
        </main>
    );
};
