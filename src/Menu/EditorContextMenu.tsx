import { updateType } from "graph.exe-core";
import { nanoid } from "nanoid";
import React, { CSSProperties, KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
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
    width: "15rem",
    border: "1px solid gray !important",
    borderRadius: "1rem 0rem 0rem 0rem",
    paddingBottom: "0.3rem"
}

const contextMenuItem: CSSProperties = {
    width: "15rem",
    borderBottom: "1px solid gray",
    borderRight: "1px solid gray",
    overflowWrap: "normal"
}

const contextMenuItemSelected: CSSProperties = {
    width: "15rem",
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
    const selectedElement = useRef<HTMLDivElement>(null);

    const [searchText, setSearchText] = useState<string>("nodes");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);

    const [catalogue, setCatalogue] = useState<NodeCategory[]>([])
    const [maxIndex, setMaxIndex] = useState<number>(0);

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
            case "ArrowDown": setSelectedIndex((index) => index < maxIndex - 1 ? index + 1 : index); break;
            case "Enter": if (contextMenuRef.current) addNodeToEditorByKey(
                contextMenuRef.current.getBoundingClientRect().x,
                contextMenuRef.current.getBoundingClientRect().y
            ); break;
            default: break;
        }
    }

    const addNodeToEditorByKey = (x: number, y: number) => {

        let node = addNodeByIndex(catalogue, selectedIndex);

        if (node === null) return;
        addNodeToEditor(x, y, node);
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
            }),
            static: false
        }
        props.addNode(engineNode);
    }

    useEffect(() => {
        const [matches, max] = createNodeCategories(props.config, searchText);

        setCatalogue(matches);
        setMaxIndex(max);
    }, [searchText])

    useEffect(() => {
        setSearchText("");
    }, [props.show])

    useLayoutEffect(() => {
        if (!selectedElement.current) return;
        selectedElement.current.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    })

    useEffect(() => {
        const [catalogue, max] = createNodeCategories(props.config, "");

        setCatalogue(catalogue);
        setMaxIndex(max);
    }, [])

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
                        style={editorContextMenuCSS} ref={contextMenuRef} onWheel={e => { e.preventDefault(); e.stopPropagation(); }}
                    >
                        {
                            catalogue.map((category) => {
                                listId++;
                                return (<div key={listId}>
                                    <header>{category.categoryName}</header>
                                    {category.nodes.map((showNode) => {
                                        listId++;
                                        return (
                                            <div
                                                ref={selectedIndex === showNode.index ? selectedElement : null}
                                                style={
                                                    selectedIndex === showNode.index ?
                                                        contextMenuItemSelected : contextMenuItem
                                                }
                                                key={listId}
                                                onClick={e => addNodeToEditor(e.clientX, e.clientY, showNode.node)}
                                                onMouseEnter={() => setSelectedIndex(showNode.index)}
                                            >
                                                <header
                                                    style={contextMenuItemHeader}
                                                >{showNode.node.name}</header>
                                                <span
                                                    style={contextMenuItemSpan}
                                                >{showNode.node.description}</span>
                                            </div>
                                        )
                                    })}
                                </div>)
                            })
                        }
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

export interface showNode {
    node: ProtoNode,
    index: number,
}

export interface NodeCategory {
    categoryName: string,
    nodes: showNode[],
}

interface categoriesDict {
    [k: string]: ProtoNode[]
}

const createNodeCategories = (config: ProtoNodeDict, search: string): [NodeCategory[], number] => {

    const categoriesDict: categoriesDict = {}

    Object.entries(config).map(([id, node]) => {

        if (node.private || !node.name.toLocaleLowerCase().includes(search.toLocaleLowerCase())) return;

        const category = node.category;

        if (!category && !("nodes" in categoriesDict)) {
            categoriesDict["nodes"] = [node]; return;
        }

        if (!category) {
            categoriesDict["nodes"].push(node); return;
        }

        if (category in categoriesDict)
            categoriesDict[category].push(node);
        else
            categoriesDict[category] = [node];
    })

    const categories: NodeCategory[] = []

    let nodeIndex: number = 0;

    Object.entries(categoriesDict).map(([category, nodes]) => {
        if (category === "nodes") return;

        const showNodes: showNode[] = [];

        nodes.map((n) => { showNodes.push({ node: n, index: nodeIndex }); nodeIndex++; })

        categories.push({ categoryName: category, nodes: showNodes });

    })

    if ("nodes" in categoriesDict) {
        const showNodes: showNode[] = [];
        categoriesDict["nodes"].map((node) => {
            showNodes.push({ node: node, index: nodeIndex }); nodeIndex++;
        })
        categories.push({ categoryName: "nodes", nodes: showNodes });
    }

    return [categories, nodeIndex];
}

const addNodeByIndex = (catalogue: NodeCategory[], index: number): (ProtoNode | null) => {

    let searchIndex = 0;

    for (let i = 0; i < catalogue.length; i++) {

        if (catalogue[i].nodes.length + searchIndex <= index) {
            searchIndex += catalogue[i].nodes.length;
            continue;
        }

        for (let j = 0; j < catalogue[i].nodes.length; j++)
            if (catalogue[i].nodes[j].index === index) {
                return catalogue[i].nodes[j].node
            }

    }
    return null;
}