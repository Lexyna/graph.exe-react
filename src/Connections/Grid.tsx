import React from "react";

export const Grid = (props: GridProps) => {

    const defaultColor: string = props.style?.lineColor ? props.style.lineColor : "rgb(55, 55, 55)";
    const boldColor: string = props.style?.boldLineColor ? props.style.boldLineColor : "black";
    const boldLineSpacing: number = props.style?.boldLineSpacing ? props.style.boldLineSpacing : 7;

    const [defaultLines, boldLines] = generateLineArrays(
        15 * props.zoom, props.width, props.height, props.offsetX, props.offsetY, props.editorOffset.x, props.editorOffset.y, defaultColor, boldColor, boldLineSpacing
    );

    let keyId: number = 0;

    return (
        <svg>
            {defaultLines.map((line) => {
                keyId++;
                return (
                    <line
                        key={keyId}
                        x1={line.startX}
                        x2={line.endX}
                        y1={line.startY}
                        y2={line.endY}
                        stroke={line.color}
                    ></line>
                )
            })}
            {boldLines.map((line) => {
                keyId++;
                return (
                    <line
                        key={keyId}
                        x1={line.startX}
                        x2={line.endX}
                        y1={line.startY}
                        y2={line.endY}
                        stroke={line.color}
                    ></line>
                )
            })}
        </svg>
    )
}

const generateLineArrays = (gridPadding: number, lineWidth: number, lineHeight: number, offsetX: number, offsetY: number, editorOffsetX: number, editorOffsetY: number, defaultColor: string, boldColor: string, boldLineSpacing: number): [line[], line[]] => {

    const defaultLines: line[] = [];
    const boldLines: line[] = [];

    let boldLine = boldLineSpacing;
    const boldLineModulus = boldLineSpacing + 1;

    for (let i = -gridPadding; i < lineWidth + editorOffsetX; i += gridPadding) {
        boldLine++;

        defaultLines.push({
            startX: i + (offsetX % gridPadding) - editorOffsetX,
            startY: 0,
            endX: i + (offsetX % gridPadding) - editorOffsetX,
            endY: lineHeight,
            color: defaultColor
        })

        if (boldLineSpacing !== 0 && boldLine % boldLineModulus == 0)
            boldLines.push({
                startX: i + (offsetX % (boldLineModulus * gridPadding)) - editorOffsetX,
                startY: 0,
                endX: i + (offsetX % (boldLineModulus * gridPadding)) - editorOffsetX,
                endY: lineHeight,
                color: boldColor
            })
    }

    boldLine = boldLineSpacing;

    for (let i = -gridPadding; i < lineHeight + editorOffsetY; i += gridPadding) {
        boldLine++;

        defaultLines.push({
            startX: 0,
            startY: i + (offsetY % gridPadding) - editorOffsetY,
            endX: lineWidth,
            endY: i + (offsetY % gridPadding) - editorOffsetY,
            color: defaultColor
        })

        if (boldLineSpacing !== 0 && boldLine % boldLineModulus == 0)
            boldLines.push({
                startX: 0,
                startY: i + (offsetY % (boldLineModulus * gridPadding)) - editorOffsetY,
                endX: lineWidth,
                endY: i + (offsetY % (boldLineModulus * gridPadding)) - editorOffsetY,
                color: boldColor
            })
    }

    return [defaultLines, boldLines];
}

export interface GridProps {
    width: number;
    height: number;
    offsetX: number;
    offsetY: number;
    editorOffset: { x: number, y: number },
    zoom: number;
    style?: GridOptions
}

interface line {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    color: string;
}

export interface GridOptions {
    backgroundColor?: string;
    lineColor?: string;
    boldLineSpacing?: number;
    boldLineColor?: string;
}