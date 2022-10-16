import { ConnectionDetails, EngineIO, EngineNode, nodeBuilder } from "graph.exe-core";
import { CON_MAPPING } from "graph.exe-core/dist/cjs/core/IO/IOMapping";
import { nanoid } from "nanoid";
import { ProtoEngineNode, ProtoNode } from "../ProtoTypes/ProtoNode";

export const computeBezierCurve = (x1: number, y1: number, x2: number, y2: number): string => {
    const dif = Math.abs(x1 - x2) / 1.5;
    return "M" + x1 + "," + y1 +
        "C" + (x1 + dif) + "," + y1 + ", " +
        (x2 - dif) + "," + y2 + " " + x2 + "," + y2;
}

export const findIO = (io: ConnectionDetails, nodes: ProtoEngineNode[], isInput: boolean): EngineIO<any, any> => {
    let ret: EngineIO<any, any> = {
        data: null,
        mapping: CON_MAPPING.SINGLE,
        type: "",
        value: null
    };
    nodes.forEach(n => {
        if (n.id === io.nodeId)
            isInput ? ret = n.inputs[io.index] : ret = n.outputs[io.index];
    })
    return ret;
}

/**
 * 
 * @param protoNode ConfigNode, providing functionality to the EngineNode
 * @param staticNode Optional, declares if the node will be deletable.  false - deletable | true - non deletable. Default: false
 * @returns 
 */
export const buildEngineNode = (protoNode: ProtoNode, staticNode: boolean = false): ProtoEngineNode => {
    const engineNode: EngineNode = nodeBuilder(protoNode, nanoid());
    return {
        ...engineNode,
        static: staticNode,
        position: { x: 0, y: 0 }
    }
}