import React, { CSSProperties, useState } from "react";

export const Connection = (props: ConnectionProps) => {

    const [strokeWidth, setStrokeWidth] = useState<number>(2);

    const connectionStyle: CSSProperties = {
        transform: `scale(${props.zoom})`,
        stroke: props.color,
        strokeWidth: strokeWidth,
        strokeDasharray: props.dashArray ? props.dashArray : "",
    };

    const onHover = () => { setStrokeWidth(6) }
    const onHoverLeave = () => { setStrokeWidth(2) }

    return (
        <svg onMouseEnter={onHover} onMouseLeave={onHoverLeave}>
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