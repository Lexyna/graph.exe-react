import React, { CSSProperties, MouseEvent, useRef, useState, WheelEvent } from "react";
import { ConnectionStage } from "../Connections/ConnectionsStage";
import { EditorContextMenu } from "../ContextMenu/EditorContextMenu";
import { ProtoEngineNodeDict, ProtoNodeDict } from "../ProtoTypes/ProtoNode";
import { Offset } from "../Utils/utilTypes";

const nodeEditorCSS: CSSProperties = {
    height: "inherit",
    width: "inherit",
    display: "flex",
    position: "relative",
    overflow: "hidden"
}

export const NodeEditor = (props: NodeEditorProps) => {

    const editorRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState<number>(1);

    const zoomListener = (e: WheelEvent) => {
        let newZoom = zoom;

        if (e.deltaY > 0) newZoom += 0.05;
        else newZoom -= 0.05;

        if (newZoom < 0.3 || newZoom > 1.2) return
        setZoom(newZoom);
    }

    const [isPanning, setIsPanning] = useState<boolean>(false);
    const [panningOffset, setPanningOffset] = useState<Offset>({
        x: 0,
        y: 0
    });

    const updatePanningOffset = (e: MouseEvent) => {
        if (!isPanning) return;

        setPanningOffset({
            x: panningOffset.x + e.movementX,
            y: panningOffset.y + e.movementY
        })
    }

    const onMouseMoveHandler = (e: MouseEvent) => {
        updatePanningOffset(e);
    }

    const onMouseDownHandler = (e: MouseEvent) => {
        if (e.button === 1) setIsPanning(true);
    }

    const onMouseUpHandler = (e: MouseEvent) => {
        setIsPanning(false);
    }

    //helper state to track context menu options
    const [contextMenuOptions, setContextMenuOptions] = useState<ContextMenuOptions>({
        show: false,
        x: 0,
        y: 0
    })

    const showContextMenu = (e: MouseEvent) => {
        setContextMenuOptions({
            show: true,
            x: e.clientX,
            y: e.clientY
        })
    }

    const hideContextMenu = () => {
        setContextMenuOptions({
            ...contextMenuOptions,
            show: false,
        })
    }

    return (
        <div
            ref={editorRef}
            style={nodeEditorCSS}
            onWheel={zoomListener}
            onMouseMove={onMouseMoveHandler}
            onMouseDown={onMouseDownHandler}
            onMouseUp={onMouseUpHandler}
            onClick={() => {
                hideContextMenu();
            }}
        >
            <EditorContextMenu
                addNode={(node) => { }}
                config={props.config}
                panning={panningOffset}
                show={contextMenuOptions.show}
                zoom={zoom}
                x={contextMenuOptions.x}
                y={contextMenuOptions.y}

            ></EditorContextMenu>
            <ConnectionStage
                zoom={zoom}
                editorOffset={{ x: 0, y: 0 }}
                panningOffset={panningOffset}
                showContextMenu={showContextMenu}
            ></ConnectionStage>
        </div>
    )
}

export interface NodeEditorProps {
    config: ProtoNodeDict,
    nodes: ProtoEngineNodeDict
}
export interface ContextMenuOptions {
    show: boolean,
    x: number,
    y: number
}