import { ConnectionDetails } from "graph.exe-core"
import React, { CSSProperties, MouseEvent } from "react"
import { NodeIO } from "../NodeIO/NodeIO"
import { io_ul_CSS } from "../NodeIO/NodeIOStyles"
import { ProtoEngineNode, ProtoNode } from "../ProtoTypes/ProtoNode"
import { Offset } from "../Utils/utilTypes"
import { ConnectionDot } from "./NodeEditor"

const headerCSS: CSSProperties = {
    backgroundColor: "#297286BB",
    display: "block",
    color: "white",
    borderRadius: "5px 5px 0px 0px",
    textAlign: "left",
    cursor: "pointer",
    fontFamily: "Courier New', Courier, monospace",
    padding: "2px 12px 5px",
    userSelect: "none",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    KhtmlUserSelect: "none",
    MozUserSelect: "none",
    msUserSelect: "none"
}

export const GraphNode = (props: NodeProps) => {

    const nodeCSS: CSSProperties = {
        display: "block",
        maxWidth: "15rem",
        minWidth: "7rem",
        width: "auto",
        height: "auto",
        position: "absolute",
        paddingBottom: "7px",
        border: "1px solid black",
        borderRadius: "6px",
        boxShadow: "0px 6px 14px #000000dd",
        top: props.position.y - props.editorOffset.y + "px",
        left: props.position.x - props.editorOffset.x + "px",
        transform: `scale(${props.zoom})`,
        transformOrigin: "top left",
        backgroundColor: "rgba(63, 63, 63, .7)"
    }

    const onDrag = (e: MouseEvent) => {
        const diffX = e.pageX - props.position.x;
        const diffY = e.pageY - props.position.y;

        props.dragHandler(props.engineNode.id, diffX, diffY);
        props.reorderNode(props.index)
    }

    const deleteNode = () => {
        if (!props.engineNode.static)
            props.deleteNode(props.engineNode.id)
    }

    let ioKey = 0;

    return (
        <div>
            <div
                style={nodeCSS}
                onContextMenu={e => {
                    e.preventDefault();
                    deleteNode();
                }}
            >
                <header
                    style={headerCSS}
                    onMouseDown={e => {
                        e.preventDefault();
                        onDrag(e);
                    }}
                >
                    {props.configNode.name}
                </header>
                {props.engineNode.inputs.map((io, index) => {
                    ioKey++;
                    return (
                        <ul style={io_ul_CSS} key={ioKey}>
                            <NodeIO
                                key={ioKey++}
                                nodeId={props.engineNode.id}
                                index={index}
                                isInput={true}
                                label={props.configNode.inputs[index].label}
                                io={io}
                                extra={props.configNode.inputs[index].extra}
                                updateData={props.updateData}
                                addConnectionReference={props.addConnectionReferences}
                                onInputClicked={props.onInputClicked}
                            >
                            </NodeIO>
                        </ul>
                    )
                })}
                {props.engineNode.outputs.map((io, index) => {
                    ioKey++;
                    return (
                        <ul style={io_ul_CSS} key={ioKey}>
                            <NodeIO
                                key={ioKey++}
                                nodeId={props.engineNode.id}
                                index={index}
                                isInput={false}
                                label={props.configNode.inputs[index].label}
                                io={io}
                                extra={props.configNode.outputs[index].extra}
                                updateData={props.updateData}
                                addConnectionReference={props.addConnectionReferences}
                                onOutputClicked={props.onOutputClicked}
                            >
                            </NodeIO>
                        </ul>
                    )
                })}
            </div>
        </div >
    )

}

export interface NodeProps {
    engineNode: ProtoEngineNode,
    configNode: ProtoNode,
    index: number,
    zoom: number,
    position: Offset,
    editorOffset: Offset
    updateData: (id: string, input: boolean, index: number, data: any) => void,
    dragHandler: (id: string, x: number, y: number) => void,
    deleteNode: (id: string) => void,
    reorderNode: (index: number) => void,
    addConnectionReferences: (ref: ConnectionDot, isInput: boolean, index: number) => void,
    onOutputClicked: (ioDetails: ConnectionDetails) => void
    onInputClicked: (inputDetails: ConnectionDetails) => void
}