import React, { CSSProperties } from "react";

export const Connection = (props: ConnectionProps) => {

    const connectionStyle: CSSProperties = {
        transform: `scale(${props.zoom})`,
        stroke: props.color,
        strokeWidth: 2,
        strokeDasharray: props.dashArray ? props.dashArray : "",
    };

    return (
        <svg>
            <path
                style={connectionStyle}
                fill="none"
                d={props.d}
            />
        </svg>
    )

}

export interface ConnectionProps {
    zoom: number,
    color: string,
    dashArray: string,
    d: string
}