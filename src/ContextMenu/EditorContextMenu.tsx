import { updateType } from "graph.exe-core";
import { nanoid } from "nanoid";
import React, { CSSProperties, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ProtoEngineNode, ProtoNode, ProtoNodeDict } from "../ProtoTypes/ProtoNode";
import { Offset } from "../Utils/utilTypes";

const editorContextMenuCSS: CSSProperties = {
    display: "block",
    width: "auto",
    minWidth: "14rem",
    maxHeight: "20rem",
    backgroundColor: "rgba(63, 63, 63, .7)",
    border: "1px solid gray",
    borderRadius: "0rem 0rem 1rem 0rem",
    boxShadow: "0px 16px 14px #000000dd",
    position: "absolute",
    overflowX: "hidden",
    overflowY: "auto",
}

const contextMenuSearchBar: CSSProperties = {
    borderBottom: "1px solid gray",
    borderRight: "1px solid gray",
    overflowWrap: "normal",
    fontSize: "x-large",
    backgroundColor: "rgba(63, 63, 63, 1)",
    width: "16rem",
    border: "1px solid gray !important",
    borderRadius: "1rem 0rem 0rem 0rem",
    paddingBottom: "0.3rem"
}

const contextMenuItem: CSSProperties = {
    borderBottom: "1px solid gray",
    borderRight: "1px solid gray",
    overflowWrap: "normal"
}

const contextMenuItemSelected: CSSProperties = {
    borderBottom: "1px solid gray",
    borderRight: "1px solid gray",
    overflowWrap: "normal",
    backgroundColor: "rgba(70, 70,70,1)"
}

const contextMenuItemHeader: CSSProperties = {
    color: "white",
    textAlign: "left",
    paddingLeft: ".3rem",
    fontWeight: "bold"
}

const contextMenuItemSpan: CSSProperties = {
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
    fontStyle: "italic",
    fontSize: "medium",
    color: "lightgray",
    display: "block"
}

const contextMenuInput: CSSProperties = {
    marginLeft: "0.5rem",
    width: "auto",
    border: "none",
    backgroundColor: "rgba(0, 0, 0, 0)",
    fontStyle: "italic",
    fontSize: "medium",
    color: "white",
    display: "block",
    outline: "none"
}

export const EditorContextMenu = (props: EditorContextMenuProps) => {

    const contextMenuRef = useRef<HTMLDivElement>(null);

    const [searchText, setSearchText] = useState<string>("");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const [nodes, setNodes] = useState<ProtoNode[]>([])

    const editorContextMenuContainerCSS: CSSProperties = {
        position: "fixed",
        zIndex: "1",
        top: `${props.y}px`,
        left: `${props.x}px`
    }

    const updateTextSearch = (s: string) => {
        setSelectedIndex(0);
        setSearchText(s);
    }

    const onKeyDownHandler = (e: KeyboardEvent) => {
        switch (e.key) {
            case "ArrowUp": setSelectedIndex((index) => index > 0 ? index - 1 : index); break;
            case "ArrowDown": setSelectedIndex((index) => index < nodes.length - 1 ? index + 1 : index); break;
            case "Enter": break;
            default: break;
        }
    }

    const addNodeToEditor = (x: number, y: number, node: ProtoNode) => {

        const engineNode: ProtoEngineNode = {
            id: nanoid(),
            configId: node.id,
            updateType: node.updateType ? node.updateType : updateType.DYNAMIC,
            position: {
                x: x / props.zoom - props.panning.x / props.zoom,
                y: y / props.zoom - props.panning.y / props.zoom
            },
            inputs: node.inputs.map((io) => {
                return {
                    data: io.data,
                    mapping: io.mapping,
                    type: io.type,
                    value: io.value
                }
            }),
            outputs: node.outputs.map((io) => {
                return {
                    data: io.data,
                    mapping: io.mapping,
                    type: io.type,
                    value: io.value
                }
            })
        }
        props.addNode(engineNode);
    }

    useEffect(() => {
        const matches: ProtoNode[] = [];

        Object.entries(props.config).forEach(([id, node]) => {
            if (node.name.toLocaleLowerCase().includes(searchText.toLocaleLowerCase()))
                matches.push(node);
        })

        setNodes(matches);
    }, [searchText])

    useEffect(() => {
        setSearchText("");
    }, [props.show])

    let listId = 0;

    return (
        <div
            style={editorContextMenuContainerCSS}
            onContextMenu={e => e.preventDefault()}
        >
            {props.show ?
                <div>
                    <div
                        style={contextMenuSearchBar}
                        onKeyDown={e => onKeyDownHandler(e)}
                        tabIndex={0}
                    >
                        <header
                            style={contextMenuItemHeader}
                        >
                            Search</header>
                        <input
                            style={contextMenuInput}
                            autoFocus
                            placeholder="search..."
                            type="text"
                            onChange={e => updateTextSearch(e.target.value)}
                        />
                    </div>
                    <div
                        style={editorContextMenuCSS} ref={contextMenuRef}
                    >
                        {nodes.filter(n => (n.private === undefined || !n.private)).map((node, index) => {
                            listId++;
                            return (
                                <div
                                    style={
                                        selectedIndex === index ?
                                            contextMenuItemSelected : contextMenuItem
                                    }
                                    key={listId}
                                    onClick={e => addNodeToEditor(e.clientX, e.clientY, node)}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                >
                                    <header
                                        style={contextMenuItemHeader}
                                    >{node.name}</header>
                                    <span
                                        style={contextMenuItemSpan}
                                    >{node.description}</span>
                                </div>
                            )
                        })}
                    </div>
                </div> : null}
        </div>
    )
}

export interface EditorContextMenuProps {
    config: ProtoNodeDict,
    zoom: number,
    addNode: (node: ProtoEngineNode) => void,
    panning: Offset,
    show: boolean,
    x: number,
    y: number
}