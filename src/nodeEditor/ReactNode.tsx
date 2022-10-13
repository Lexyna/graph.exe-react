import { EngineNode } from "graph.exe-core"
import React from "react"

export interface ReactNodeProps {
    node: EngineNode,
    index: number,

}


export const ReactNode = (props: ReactNodeProps) => {

    return (
        <div>

        </div>
    )
}