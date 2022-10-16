import { ConnectionDetails, CONNECTION_TYPE, EngineIO } from "graph.exe-core";
import React, { FunctionComponent, MouseEvent, useEffect, useRef } from "react";
import { ConnectionDot } from "../nodeEditor";
import { ExtraProps, ProtoIOStyle } from "../ProtoTypes/ProtoIO";
import { io_ul_li_input_CSS, io_ul_li_i_input, io_ul_li_i_output, io_ul_li_output_CSS, io_ul_li_span_CSS } from "./NodeIOStyles";



export const NodeIO = (props: NodeIOProps<any, any>) => {
    const ioRef = useRef<HTMLUListElement>(null);

    const onRightClick = (e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }

    const updateData = (data: any) => {
        props.updateData(props.nodeId, props.isInput, props.index, data);
    }

    const onClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (!props.isInput && props.onOutputClicked !== undefined) {
            props.onOutputClicked({
                nodeId: props.nodeId,
                type: CONNECTION_TYPE.OUTPUT,
                index: props.index,
                ioId: props.nodeId + CONNECTION_TYPE.OUTPUT + props.index
            });
            return;
        }
        if (props.isInput && props.onInputClicked !== undefined) {
            props.onInputClicked({
                nodeId: props.nodeId,
                type: CONNECTION_TYPE.INPUT,
                index: props.index,
                ioId: props.nodeId + CONNECTION_TYPE.INPUT + props.index
            });
            return;
        }
    }

    useEffect(() => {
        if (!ioRef.current) return;
        props.addConnectionReference(
            {
                x: () => {
                    if (!ioRef.current) return -1;
                    return ioRef.current?.getBoundingClientRect().left +
                        ioRef.current?.getBoundingClientRect().width - 0.01;
                },
                y: () => {
                    if (!ioRef.current) return -1;
                    return ioRef.current.getBoundingClientRect().y +
                        0.4 * ioRef.current.getBoundingClientRect().height;
                },
                color: props.style ? props.style.color : "white"
            },
            props.isInput,
            props.index
        )
    }, [])

    const CustomComponent = props.extra as FunctionComponent<ExtraProps<any, any>>;

    return (
        <li
            style={props.isInput ? io_ul_li_input_CSS : io_ul_li_output_CSS}
        >
            {props.extra ?
                <div>
                    <CustomComponent
                        value={props.io.value}
                        data={props.io.data}
                        setData={updateData}
                    />
                </div> :
                (<span
                    style={io_ul_li_span_CSS}
                >{props.label}</span>)
            }
            <i
                style={{
                    ...props.isInput ? io_ul_li_i_input : io_ul_li_i_output,
                    backgroundColor: props.style ? props.style.color : "white"
                }}
                onContextMenu={onRightClick}
                ref={ioRef}
                onClick={onClick}
            >
            </i>
        </li>
    )

}

export interface NodeIOProps<T, K> {
    nodeId: string,
    index: number,
    isInput: boolean,
    io: EngineIO<T, K>,
    extra: React.FC<ExtraProps<T, K>> | null
    label: string,
    style?: ProtoIOStyle,
    updateData: (nodeId: string, input: boolean, index: number, data: any) => void,
    addConnectionReference: (ref: ConnectionDot, isInput: boolean, index: number) => void,
    onOutputClicked?: (ioDetails: ConnectionDetails) => void,
    onInputClicked?: (inputDetails: ConnectionDetails) => void,
    children: React.ReactNode
}