import { ConnectionDetails, EngineIO } from "graph.exe-core";
import { CON_MAPPING } from "graph.exe-core/dist/cjs/core/IO/IOMapping";
import { ProtoEngineNode } from "../ProtoTypes/ProtoNode";

export const computeBezierCurve = (x1: number, y1: number, x2: number, y2: number): string => {
    const dif = Math.abs(x1 - x2) / 1.5;
    return "M" + x1 + "," + y1 +
        "C" + (x1 + dif) + "," + y1 + ", " +
        (x2 - dif) + "," + y2 + " " + x2 + "," + y2;
}

export const findIO = (io: ConnectionDetails, nodes: ProtoEngineNode[]): EngineIO<any, any> => {
    let ret: EngineIO<any, any> = {
        data: null,
        mapping: CON_MAPPING.SINGLE,
        type: "",
        value: null
    };
    nodes.forEach(n => {
        if (n.id === io.nodeId)
            ret = n.inputs[io.index];
    })
    return ret;
}