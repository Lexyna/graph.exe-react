import { ConfigNodeDict, EngineNodeDict } from "graph.exe-core";
import React, { CSSProperties, useRef } from "react";
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

    return (
        <div
            ref={editorRef}
            style={nodeEditorCSS}
        >
            <ConnectionStage
                zoom={1}
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
