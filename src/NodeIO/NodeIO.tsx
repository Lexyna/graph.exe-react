import { ConnectionDetails, CONNECTION_TYPE, EngineIO } from "graph.exe-core";
import React, { FunctionComponent, MouseEvent, useEffect, useRef, useState } from "react";
import { ValuePreview } from "../Menu/ValuePreview";
import { ConnectionDot } from "../nodeEditor";
import { ExtraProps, ProtoIOStyle } from "../ProtoTypes/ProtoIO";
import { io_ul_li_input_CSS, io_ul_li_i_input, io_ul_li_i_output, io_ul_li_output_CSS, io_ul_li_span_CSS } from "./NodeIOStyles";



export const NodeIO = (props: NodeIOProps<any, any>) => {
    const ioRef = useRef<HTMLUListElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);

    const [previewState, setPreviewState] = useState<previewState>({
        data: null,
        value: null,
        show: false,
        x: 0
    })

    const [delayHandler, setDelayHandler] = useState<any>(null);

    const showPreview = (e: MouseEvent) => {
        setDelayHandler(setTimeout(() => {
            setPreviewState({
                data: props.io.data,
                value: props.io.value,
                show: true,
                x: labelRef.current ? e.clientX - labelRef.current.getBoundingClientRect().left : 0
            })
        }, 600))
    }

    const hidePreview = () => {
        clearTimeout(delayHandler);
        setPreviewState({ ...previewState, show: false });
    }

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
                    ref={labelRef}
                    style={io_ul_li_span_CSS}
                    onMouseEnter={e => showPreview(e)}
                    onMouseLeave={hidePreview}
                >
                    {props.label}
                    {previewState.show ? <ValuePreview value={props.io.value} data={props.io.data} x={previewState.x} /> : null}
                </span>)
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

interface previewState {
    data: any,
    value: any,
    show: boolean,
    x: number
}