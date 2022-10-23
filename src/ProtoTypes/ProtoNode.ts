import { ConfigNode, EngineNode } from "graph.exe-core";
import { ProtoIO } from "./ProtoIO";

/**
 *  Modified version of ConfigNode from graph.exe-core, adds Plugin specific types
 *  @field name: used to display the name of this type of node
 *  @field description: provides a description of this node to the user 
 *  @field private: if false, disables user ability to add new nodes of this type
 */
export interface ProtoNode extends ConfigNode {
    name: string,
    description: string,
    category?: string,
    inputs: ProtoIO<any, any>[];
    outputs: ProtoIO<any, any>[];
    private?: boolean,
    style?: ProtoNodeStyle
}

export interface ProtoNodeStyle {
    headerColor?: string,
    bodyColor?: string
}

export interface ProtoNodeDict {
    [k: string]: ProtoNode
}

/**
 * Modified version of EngineNode from graph.exe-core, adds plugin specific types
 * @field position: used to draw node in editor panel
 * @field static: if true, node won't be deletable
 */
export interface ProtoEngineNode extends EngineNode {
    position: { x: number, y: number },
    static: boolean
}

export interface ProtoEngineNodeDict {
    [k: string]: ProtoEngineNode
}