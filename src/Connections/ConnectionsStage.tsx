import React, { CSSProperties, useEffect, useRef, useState } from "react";
import { clientDimension, DragOffset } from "../Utils/utilTypes";
import { Grid } from "./Grid";

const connectionStageCSS: CSSProperties = {
    width: "100%",
    backgroundColor: "rgb(38,38, 38)",
}

export const ConnectionStage = (props: ConnectionStageProps) => {

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

    useEffect(() => {
        updateClientDimensions();
    })

    const stageRef = useRef<SVGSVGElement>(null);

    return (
        <svg
            ref={stageRef}
            style={connectionStageCSS}
        >
            <Grid
                width={clientDimensions.width}
                height={clientDimensions.height}
                offsetX={props.dragOffset.x}
                offsetY={props.dragOffset.y}
                editorOffset={props.editorOffset}
                zoom={props.zoom}
            ></Grid>
        </svg>
    )
}

export interface ConnectionStageProps {
    zoom: number,
    editorOffset: { x: number, y: number },
    dragOffset: DragOffset
}