import { EngineIO } from "graph.exe-core";
import React from "react";

export interface ProtoIO<K, T> extends EngineIO<K, T> {
    label: string,
    extra: React.FC<ExtraProps<K, T>> | null
}

export interface ExtraProps<K, T> {
    setData: (data: K) => void,
    data: K,
    value: T
}