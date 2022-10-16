import { ConfigNode, EngineNode } from "graph.exe-core";
import { ProtoIO } from "./ProtoIO";

/**
 *  Modified version of ConfigNode from graph.exe-core, adds Plugin specific types
 *  name: used to display the name of this type of node
 *  description: provides a description of this node to the user 
 */
export interface ProtoNode extends ConfigNode {
    name: string,
    description: string,
    inputs: ProtoIO<any, any>[];
    outputs: ProtoIO<any, any>[];
    private?: boolean
}

export interface ProtoNodeDict {
    [k: string]: ProtoNode
}

/**
 * Modified version of EngineNode from graph.exe-core, adds plugin specific types
 * position: used to draw node in editor panel
 */
export interface ProtoEngineNode extends EngineNode {
    position: { x: number, y: number }
}

export interface ProtoEngineNodeDict {
    [k: string]: ProtoEngineNode
}