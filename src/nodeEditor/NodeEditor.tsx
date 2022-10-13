import { ConfigNodeDict, EngineNodeDict } from "graph.exe-core";
import React, { CSSProperties, useRef, useState, WheelEvent } from "react";
import { ConnectionStage } from "../Connections/ConnectionsStage";

const nodeEditorCSS: CSSProperties = {
    height: "inherit",
    width: "inherit",
    display: "flex",
    position: "relative",
    overflow: "hidden"
}

export const NodeEditor = (props: NodeEditorProps) => {

    const editorRef = useRef<HTMLDivElement>(null);

    const [zoom, setZoom] = useState(1);

    const zoomListener = (e: WheelEvent) => {
        let newZoom = zoom;

        if (e.deltaY > 0) newZoom += 0.05;
        else newZoom -= 0.05;

        if (newZoom < 0.3 || newZoom > 1.2) return
        setZoom(newZoom);
    }

    return (
        <div
            ref={editorRef}
            style={nodeEditorCSS}
            onWheel={zoomListener}
        >
            <ConnectionStage
                zoom={zoom}
                editorOffset={{ x: 0, y: 0 }}
                dragOffset={{ x: 0, y: 0 }}
            ></ConnectionStage>
        </div>
    )
}

export interface NodeEditorProps {
    config: ConfigNodeDict,
    nodes: EngineNodeDict
}
