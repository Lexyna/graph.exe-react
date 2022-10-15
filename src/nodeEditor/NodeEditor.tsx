import React, { CSSProperties, MouseEvent, useRef, useState, WheelEvent } from "react";
import { ConnectionStage } from "../Connections/ConnectionsStage";
import { EditorContextMenu } from "../ContextMenu/EditorContextMenu";
import { ProtoEngineNode, ProtoNodeDict } from "../ProtoTypes/ProtoNode";
import { computeBezierCurve } from "../Utils/utils";
import { Offset } from "../Utils/utilTypes";
import { GraphNode } from "./GraphNode";

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
        updateNodePosition(e);
        updatePanningOffset(e);
        updatePreviewConnection(e);
    }

    const onMouseDownHandler = (e: MouseEvent) => {
        if (e.button === 1) setIsPanning(true);
    }

    const onMouseUpHandler = (e: MouseEvent) => {
        setDragNodeId(null);
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

    const [dragNodeId, setDragNodeId] = useState<string | null>("");

    const [dragOffset, setDragOffset] = useState<Offset>({ x: 0, y: 0 })

    const dragHandler = (id: string, x: number, y: number) => {
        setDragNodeId(id);
        setDragOffset({ x: x, y: y });
    }

    const [nodes, setNodes] = useState<ProtoEngineNode[]>(props.nodes)

    const [connectionReferences, setConnectionReferences] = useState<ConnectionReferences>({});

    const addConnectionReference = (nodeId: string) => (ref: ConnectionDot, isInput: boolean, index: number) => {
        setConnectionReferences((cR) => {
            const ioId: string = nodeId + (isInput ? "IN" : "OUT") + index;
            if (ioId in cR) return { ...cR }
            return {
                ...cR,
                [ioId]: ref
            }
        })
    }

    const deleteNode = (nodeId: string) => {
        const newNodes: ProtoEngineNode[] = [];

        nodes.forEach((n: ProtoEngineNode) => {
            if (nodeId !== n.id) newNodes.push(n);
        })

        setNodes(newNodes);
    }

    const reorderNode = (index: number) => {
        const reorderedNodes = createNodeArrayCopy(nodes);
        const activeNode: ProtoEngineNode = reorderedNodes[index];

        reorderedNodes.splice(index, 1);
        reorderedNodes.push(activeNode);
        setNodes(reorderedNodes);
    }

    const updateNodePosition = (e: MouseEvent) => {
        if (!dragNodeId) return;

        const nodeCopies = createNodeArrayCopy(nodes);
        nodeCopies.forEach((node, index) => {
            if (node.id !== dragNodeId) return;
            nodeCopies[index].position.x = e.pageX / zoom - dragOffset.x / zoom - panningOffset.x / zoom;
            nodeCopies[index].position.y = e.pageY / zoom - dragOffset.y / zoom - panningOffset.y / zoom;
        });
        setNodes(nodeCopies);
    }

    const updateData = (nodeId: string, input: boolean, index: number, data: any) => {
        const nodeCopies = createNodeArrayCopy(nodes);

        nodeCopies.forEach((node, nodeIndex) => {
            if (node.id !== nodeId) return;
            if (input) nodeCopies[nodeIndex].inputs[index].data = data;
            else nodeCopies[nodeIndex].outputs[index].data = data;
        })
        setNodes(nodeCopies);
    }

    const addNode = (node: ProtoEngineNode) => {
        setNodes(nodes.concat(node));
    }

    const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);

    const [previewConnection, setPreviewConnection] = useState<string>("");

    const updatePreviewConnection = (e: MouseEvent) => {
        if (selectedOutputId === null) return;
        const x2 = e.clientX;
        const y2 = e.clientY;

        setPreviewConnection(
            computeBezierCurve(
                connectionReferences[selectedOutputId].x() / zoom,
                connectionReferences[selectedOutputId].y() / zoom,
                x2 / zoom, y2 / zoom
            )
        )
    }

    const removePreviewConnection = () => {
        setSelectedOutputId(null);
        setPreviewConnection("null");
    }


    const onOutputClicked = (ioId: string) => {
        setSelectedOutputId(ioId)
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
                removePreviewConnection();
            }}
        >
            <EditorContextMenu
                addNode={addNode}
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
                previewPath={previewConnection}
            ></ConnectionStage>
            {nodes.map((node: ProtoEngineNode, index: number) => {
                return (
                    <GraphNode
                        key={node.id}
                        index={index}
                        engineNode={node}
                        configNode={props.config[node.configId]}
                        editorOffset={{ x: 0, y: 0 }}
                        zoom={zoom}
                        position={{
                            x: node.position.x * zoom + panningOffset.x,
                            y: node.position.y * zoom + panningOffset.y
                        }}
                        deleteNode={deleteNode}
                        dragHandler={dragHandler}
                        reorderNode={reorderNode}
                        updateData={updateData}
                        addConnectionReferences={addConnectionReference(node.id)}
                        onOutputClicked={onOutputClicked}
                    ></GraphNode>
                )
            })}
        </div>
    )
}

export interface NodeEditorProps {
    config: ProtoNodeDict,
    nodes: ProtoEngineNode[]
}
export interface ContextMenuOptions {
    show: boolean,
    x: number,
    y: number
}

/**
 * k: nodeId + IN/OUT + index
 */
interface ConnectionReferences {
    [k: string]: ConnectionDot
}

export interface ConnectionDot {
    x: () => number;
    y: () => number;
}

const createNodeArrayCopy = (nodes: ProtoEngineNode[]): ProtoEngineNode[] => {
    return nodes.map(n => {
        return {
            ...n,
            inputs: n.inputs.map(io => { return { ...io } }),
            outputs: n.outputs.map(io => { return { ...io } })
        }
    })
}

