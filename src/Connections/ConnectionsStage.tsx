import { EngineConnections } from "graph.exe-core";
import React, { CSSProperties, MouseEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ConnectionReferences } from "../nodeEditor";
import { computeBezierCurve } from "../Utils/utils";
import { clientDimension, Offset } from "../Utils/utilTypes";
import { Connection } from "./Connection";
import { Grid } from "./Grid";

const connectionStageCSS: CSSProperties = {
    width: "100%",
    backgroundColor: "rgb(38,38, 38)"
}

export const ConnectionStage = (props: ConnectionStageProps) => {

    const stageRef = useRef<SVGSVGElement>(null);

    const [clientDimensions, setClientDimensions] = useState<clientDimension>({
        width: 0,
        height: 0
    })

    const updateClientDimensions = () => {
        if (!stageRef.current) return;

        const width: number = stageRef.current.getBoundingClientRect().width;
        const height: number = stageRef.current.getBoundingClientRect().height;

        setClientDimensions((dim) => {
            if (dim.width == width && dim.height == height) return dim;
            return { width: width, height: height };
        })
    }

    useLayoutEffect(() => {
        if (!stageRef.current) return;

        const width: number = stageRef.current.getBoundingClientRect().width;
        const height: number = stageRef.current.getBoundingClientRect().height;

        setClientDimensions({ width: width, height: height })
    }, [props.panningOffset, props.zoom, props.editorOffset])

    useEffect(() => {
        window.addEventListener("resize", updateClientDimensions)
        return () => window.removeEventListener("resize", updateClientDimensions);
    }, [])

    return (
        <svg
            ref={stageRef}
            style={connectionStageCSS}
            onContextMenu={e => {
                e.preventDefault();
                props.showContextMenu(e);
            }}
        >
            <Grid
                width={clientDimensions.width}
                height={clientDimensions.height}
                offsetX={props.panningOffset.x}
                offsetY={props.panningOffset.y}
                editorOffset={props.editorOffset}
                zoom={props.zoom}
            ></Grid>
            {props.connections ? Object.entries(props.connections.input).map(([key, value]) => {
                return value.connections.map((details) => {
                    return <Connection
                        key={details.ioId}
                        color="green"
                        dashArray=""
                        zoom={props.zoom}
                        d={computeBezierCurve(
                            props.connectionReferences[details.ioId].x() / props.zoom - props.editorOffset.x / props.zoom,
                            props.connectionReferences[details.ioId].y() / props.zoom - props.editorOffset.y / props.zoom,
                            props.connectionReferences[value.self.ioId].x() / props.zoom - props.editorOffset.x / props.zoom,
                            props.connectionReferences[value.self.ioId].y() / props.zoom - props.editorOffset.y / props.zoom
                        )}
                    />
                })
            }) : null}
            <svg>
                <path
                    style={{ transform: `scale(${props.zoom})` }}
                    fill="none"
                    stroke="gray"
                    strokeWidth={2}
                    strokeDasharray="20,5,5,10,5,5"
                    d={props.previewPath}
                />
            </svg>
        </svg>
    )
}

export interface ConnectionStageProps {
    zoom: number,
    editorOffset: { x: number, y: number },
    panningOffset: Offset,
    showContextMenu: (e: MouseEvent) => void,
    connections: EngineConnections,
    connectionReferences: ConnectionReferences,
    previewPath: string
}