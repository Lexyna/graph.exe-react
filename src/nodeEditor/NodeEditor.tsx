import { ConnectionDetails, connectionFinder, connector, EngineConnections, EngineIO, splitter } from "graph.exe-core";
import { CON_MAPPING } from "graph.exe-core/dist/cjs/core/IO/IOMapping";
import React, { CSSProperties, MouseEvent, useRef, useState, WheelEvent } from "react";
import { ConnectionStage } from "../Connections/ConnectionsStage";
import { EditorContextMenu } from "../ContextMenu/EditorContextMenu";
import { ProtoEngineNode, ProtoEngineNodeDict, ProtoNodeDict } from "../ProtoTypes/ProtoNode";
import { computeBezierCurve, findIO } from "../Utils/utils";
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

    const [nodes, setNodes] = useState<ProtoEngineNode[]>(Object.values(props.nodes))

    const [connectionReferences, setConnectionReferences] = useState<ConnectionReferences>({});

    const addConnectionReference = (nodeId: string) => (ref: ConnectionDot, isInput: boolean, index: number) => {
        setConnectionReferences((cR) => {
            const ioId: string = nodeId + (isInput ? "INPUT" : "OUTPUT") + index;
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

        delete props.nodes[nodeId];
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
        props.nodes[node.id] = node;
        setNodes(nodes.concat(node));
    }

    const [selectedOutputDetails, setSelectedOutputId] = useState<ConnectionDetails | null>(null);

    const [previewConnection, setPreviewConnection] = useState<string>("");

    const updatePreviewConnection = (e: MouseEvent) => {
        if (selectedOutputDetails === null) return;
        const x2 = e.clientX;
        const y2 = e.clientY;

        setPreviewConnection(
            computeBezierCurve(
                connectionReferences[selectedOutputDetails.ioId].x() / zoom,
                connectionReferences[selectedOutputDetails.ioId].y() / zoom,
                x2 / zoom, y2 / zoom
            )
        )
    }

    const removePreviewConnection = () => {
        setSelectedOutputId(null);
        setPreviewConnection("null");
    }

    const onOutputClicked = (ioId: ConnectionDetails) => {
        setSelectedOutputId(ioId)
    }

    const [connections, setConnections] = useState<EngineConnections>(props.connections)

    const onConnect = (inputDetails: ConnectionDetails) => {
        //Possibly refactor this into the core as conditionalConnector
        if (selectedOutputDetails === null) {
            const existingConnections: ConnectionDetails[] = connectionFinder(inputDetails, connections);
            if (existingConnections.length === 0) return;
            splitter(existingConnections[0], inputDetails, connections);
            setSelectedOutputId(existingConnections[0]);
            return;
        }

        let input: EngineIO<any, any> = findIO(inputDetails, nodes);
        let output: EngineIO<any, any> = findIO(selectedOutputDetails, nodes);

        //test if the connectionType is valid
        if (input.type !== output.type) return;

        const mapping: CON_MAPPING = props.nodes[inputDetails.nodeId].inputs[inputDetails.index].mapping;
        const existingConnections: ConnectionDetails[] = connectionFinder(inputDetails, connections);

        //create new connection
        if (existingConnections.length === 0 && mapping === CON_MAPPING.SINGLE) {
            const connectionsCopy = createConnectionsCopy(connections);
            connector(selectedOutputDetails, inputDetails, connectionsCopy);
            removePreviewConnection();
            setConnections(connectionsCopy);
            return;
        }

        //replace existing connection
        if (existingConnections.length === 1 && mapping === CON_MAPPING.SINGLE) {
            const connectionsCopy = createConnectionsCopy(connections);
            splitter(existingConnections[0], inputDetails, connections);
            connector(selectedOutputDetails, inputDetails, connectionsCopy);
            removePreviewConnection();
            setConnections(connectionsCopy);
            return;
        }

        //add connection (mulit connection)
        const connectionsCopy = createConnectionsCopy(connections);
        connector(selectedOutputDetails, inputDetails, connectionsCopy);
        removePreviewConnection();
        setConnections(connectionsCopy);

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
                connectionReferences={connectionReferences}
                connections={connections}
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
                        onInputClicked={onConnect}
                    ></GraphNode>
                )
            })}
        </div>
    )
}

export interface NodeEditorProps {
    config: ProtoNodeDict,
    nodes: ProtoEngineNodeDict,
    connections: EngineConnections
}
export interface ContextMenuOptions {
    show: boolean,
    x: number,
    y: number
}

/**
 * k: nodeId + IN/OUT + index
 */
export interface ConnectionReferences {
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

const createConnectionsCopy = (connections: EngineConnections): EngineConnections => {
    return {
        input: { ...connections.input },
        output: { ...connections.output }
    }
}