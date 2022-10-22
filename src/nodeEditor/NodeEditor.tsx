import { ConnectionDetails, connectionFinder, connector, EngineConnections, EngineIO, executeGraph, extractor, splitter } from "graph.exe-core";
import { NodePorts } from "graph.exe-core/dist/cjs/core/connections/Extractor";
import { CON_MAPPING } from "graph.exe-core/dist/cjs/core/IO/IOMapping";
import React, { CSSProperties, MouseEvent, useEffect, useLayoutEffect, useRef, useState, WheelEvent } from "react";
import { ConnectionStage } from "../Connections/ConnectionsStage";
import { GridOptions } from "../Connections/Grid";
import { EditorContextMenu } from "../Menu/EditorContextMenu";
import { ProtoEngineNode, ProtoEngineNodeDict, ProtoNodeDict } from "../ProtoTypes/ProtoNode";
import { computeBezierCurve, findIO } from "../Utils/utils";
import { Offset } from "../Utils/utilTypes";
import { GraphNode } from "./GraphNode";

const dotCSS: CSSProperties = {
    height: "0.8rem",
    width: "0.8rem",
    borderRadius: "50%",
    display: "inline-block",
    position: "absolute",
    bottom: "0.3rem",
    right: "0.3rem"
}

const nodeEditorCSS: CSSProperties = {
    height: "inherit",
    width: "inherit",
    display: "flex",
    position: "relative",
    overflow: "hidden"
}

enum graphStatus {
    updated = "#00dd00",
    computing = "#d8d8d8",
    failed = "#dd0000",
}

export const NodeEditor = (props: NodeEditorProps) => {

    const [status, setStatus] = useState<graphStatus>(graphStatus.updated);

    const triggerGraphUpdate = () => {
        if (props.entryId !== undefined && (props.entryId in props.nodes)) {
            setStatus(graphStatus.computing)
            const [valid] = executeGraph(props.config, props.nodes, props.connections, props.entryId, false);
            valid ? setStatus(graphStatus.updated) : setStatus(graphStatus.failed);
        }
    }

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

    const [editorOffset, setEditorOffset] = useState<Offset>({ x: 0, y: 0 })

    const updateEditorOffset = () => {
        if (!editorRef.current) return;
        setEditorOffset({
            x: editorRef.current.getBoundingClientRect().x,
            y: editorRef.current.getBoundingClientRect().y
        })
    }

    useLayoutEffect(() => {
        updateEditorOffset();
    }, [panningOffset, zoom])

    useEffect(() => {
        window.addEventListener("resize", updateEditorOffset)
        return () => window.removeEventListener("resize", updateEditorOffset);
    }, [])

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

    const setNodeWrapper = (nodes: ProtoEngineNode[]) => {

        Object.entries(props.nodes).forEach(([k, v]) => delete props.nodes[k])

        nodes.forEach(n => props.nodes[n.id] = n);
        setNodes(nodes)
    }

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

        const connectionsCopy = createConnectionsCopy(connections);
        const referenceCopy = createReferenceCopy(connectionReferences);

        nodes.forEach((n: ProtoEngineNode) => {
            if (nodeId !== n.id) newNodes.push(n);
            else {

                const ports: NodePorts = extractor(n);

                ports.inputs.forEach(io => {
                    delete referenceCopy[io.ioId]
                    const cons = connectionFinder(io, connectionsCopy);
                    cons.forEach(out =>
                        splitter(out, io, connectionsCopy)
                    )
                })

                ports.outputs.forEach(io => {
                    delete referenceCopy[io.ioId]
                    const cons = connectionFinder(io, connectionsCopy);
                    cons.forEach(inp => {
                        splitter(io, inp, connectionsCopy);
                    })
                })

            }
        })

        setConnectionWrapper(connectionsCopy)
        setNodeWrapper(newNodes);
        setConnectionReferences(referenceCopy)
        triggerGraphUpdate()
    }

    const reorderNode = (index: number) => {
        const reorderedNodes = createNodeArrayCopy(nodes);
        const activeNode: ProtoEngineNode = reorderedNodes[index];

        reorderedNodes.splice(index, 1);
        reorderedNodes.push(activeNode);
        setNodeWrapper(reorderedNodes);
    }

    const updateNodePosition = (e: MouseEvent) => {
        if (!dragNodeId) return;

        const nodeCopies = createNodeArrayCopy(nodes);
        nodeCopies.forEach((node, index) => {
            if (node.id !== dragNodeId) return;
            nodeCopies[index].position.x = e.pageX / zoom - dragOffset.x / zoom - panningOffset.x / zoom;
            nodeCopies[index].position.y = e.pageY / zoom - dragOffset.y / zoom - panningOffset.y / zoom;
        });
        setNodeWrapper(nodeCopies);
    }

    const updateData = (nodeId: string, input: boolean, index: number, data: any) => {
        const nodeCopies = createNodeArrayCopy(nodes);

        nodeCopies.forEach((node, nodeIndex) => {
            if (node.id !== nodeId) return;
            if (input) nodeCopies[nodeIndex].inputs[index].data = data;
            else nodeCopies[nodeIndex].outputs[index].data = data;
        })
        setNodeWrapper(nodeCopies);
        triggerGraphUpdate()
    }

    const addNode = (node: ProtoEngineNode) => {
        props.nodes[node.id] = node;
        setNodeWrapper(nodes.concat(node));
        setContextMenuOptions({ ...contextMenuOptions, show: false })
    }

    const [selectedOutputDetails, setSelectedOutputId] = useState<ConnectionDetails | null>(null);

    const [previewConnection, setPreviewConnection] = useState<string>("");

    const updatePreviewConnection = (e: MouseEvent) => {
        if (selectedOutputDetails === null) return;
        const x2 = e.clientX;
        const y2 = e.clientY;

        setPreviewConnection(
            computeBezierCurve(
                connectionReferences[selectedOutputDetails.ioId].x() / zoom - editorOffset.x / zoom,
                connectionReferences[selectedOutputDetails.ioId].y() / zoom - editorOffset.y / zoom,
                x2 / zoom - editorOffset.x / zoom,
                y2 / zoom - editorOffset.y / zoom
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

    const setConnectionWrapper = (cons: EngineConnections) => {

        Object.entries(props.connections.input).forEach(([k, v]) => {
            delete props.connections.input[k]
        })

        Object.entries(props.connections.output).forEach(([k, v]) => {
            delete props.connections.output[k]
        })

        Object.entries(cons.input).forEach(([k, v]) => props.connections.input[k] = v)
        Object.entries(cons.output).forEach(([k, v]) => props.connections.output[k] = v)

        setConnections(cons);
        triggerGraphUpdate();
    }

    const onConnect = (inputDetails: ConnectionDetails) => {
        //Possibly refactor this into the core as conditionalConnector
        if (selectedOutputDetails === null) {
            const existingConnections: ConnectionDetails[] = connectionFinder(inputDetails, connections);
            if (existingConnections.length === 0) return;
            const connectionsCopy = createConnectionsCopy(connections);
            splitter(existingConnections[0], inputDetails, connectionsCopy);
            setSelectedOutputId(existingConnections[0]);
            setConnectionWrapper(connectionsCopy);
            return;
        }

        let input: EngineIO<any, any> = findIO(inputDetails, nodes, true);
        let output: EngineIO<any, any> = findIO(selectedOutputDetails, nodes, false);

        //test if the connectionType is valid
        if (input.type !== output.type) return;

        const mapping: CON_MAPPING = props.nodes[inputDetails.nodeId].inputs[inputDetails.index].mapping;
        const existingConnections: ConnectionDetails[] = connectionFinder(inputDetails, connections);

        const connectionsCopy = createConnectionsCopy(connections);

        //if output mapping is SINGLE, remove previous connection
        if (output.mapping === CON_MAPPING.SINGLE) {
            const prevConnections: ConnectionDetails[] = connectionFinder(selectedOutputDetails, connectionsCopy);
            prevConnections.forEach(con => splitter(selectedOutputDetails, con, connectionsCopy))
        }

        //create new connection
        if (existingConnections.length === 0 && mapping === CON_MAPPING.SINGLE) {
            connector(selectedOutputDetails, inputDetails, connectionsCopy);
            removePreviewConnection();
            setConnectionWrapper(connectionsCopy);
            return;
        }

        //replace existing connection
        if (existingConnections.length === 1 && mapping === CON_MAPPING.SINGLE) {
            splitter(existingConnections[0], inputDetails, connectionsCopy);
            connector(selectedOutputDetails, inputDetails, connectionsCopy);
            removePreviewConnection();
            setConnectionWrapper(connectionsCopy);
            return;
        }

        //add connection (multi connection)
        connector(selectedOutputDetails, inputDetails, connectionsCopy);
        removePreviewConnection();
        setConnectionWrapper(connectionsCopy);
    }

    const removeConnection = (inputDetails: ConnectionDetails, outputDetails: ConnectionDetails) => {
        const connectionsCopy = createConnectionsCopy(connections);
        splitter(outputDetails, inputDetails, connectionsCopy);
        setConnectionWrapper(connectionsCopy);
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
                editorOffset={editorOffset}
                panningOffset={panningOffset}
                showContextMenu={showContextMenu}
                connectionReferences={connectionReferences}
                connections={connections}
                previewPath={previewConnection}
                deleteConnection={removeConnection}
                gridStyle={props.gridStyle}
            ></ConnectionStage>
            {nodes.map((node: ProtoEngineNode, index: number) => {
                return (
                    <GraphNode
                        key={node.id}
                        index={index}
                        engineNode={node}
                        configNode={props.config[node.configId]}
                        editorOffset={editorOffset}
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
                        debugMode={props.debugMode}
                    ></GraphNode>
                )
            })}
            {props.entryId !== undefined ? <span style={{ ...dotCSS, backgroundColor: status }}></span> : null}
        </div>
    )
}

/**
 * @field config: ConfigNodes for the editor assigns functionality to engineNodes 
 * @field nodes: EngineNodes use to display and store data and 
 * @field connections: EngineNode connections
 * @field update: Optional callback to a function that will trigger every time the graph changes
 * @field debugMode: If true, will display a stringified version of io Ports value (Only applies to non custom io Ports)
 * @field entryId: if provided (& valid) will update the Graph with each change. Display's current Graphs status in the bottom right
 */
export interface NodeEditorProps {
    config: ProtoNodeDict,
    nodes: ProtoEngineNodeDict,
    connections: EngineConnections,
    debugMode: boolean,
    entryId?: string,
    gridStyle?: GridOptions
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
    color: string
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

const createReferenceCopy = (references: ConnectionReferences): ConnectionReferences => {
    return {
        ...references
    }
}