import { EngineIO } from "graph.exe-core";
import React from "react";

export interface ProtoIO<T, K> extends EngineIO<T, K> {
    extra: React.FC<ExtraProps<T, K>> | null
}

export interface ExtraProps<T, K> {
    setData: (data: K) => void,
    data: K,
    value: T
}