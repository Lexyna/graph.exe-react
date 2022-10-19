import React, { CSSProperties } from "react";

export const ValuePreview = (props: ValuePreviewProps) => {

    const valuePreviewCSS: CSSProperties = {
        width: "fit-content",
        height: "inherit",
        position: "absolute",
        border: "2px solid gray",
        borderRadius: "0.7rem",
        backgroundColor: "rgba(180, 180, 180, 0.8)",
        padding: "0.3rem 0.3rem 0.3rem 0.3rem",
        zIndex: "1",
        top: `10px`,
        left: `${props.x}px`
    }

    let previewString = "value: " + JSON.stringify(props.value, null, 2);
    if (props.data !== null)
        previewString += `\ndata: ${JSON.stringify(props.data, null, 2)}`;

    return (
        <pre
            style={valuePreviewCSS}
        >
            {previewString}
        </pre>)
}

export interface ValuePreviewProps {
    data: any,
    value: any,
    x: number
}