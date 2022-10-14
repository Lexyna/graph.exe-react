import { EngineIO } from "graph.exe-core";
import React, { FunctionComponent, MouseEvent, useRef } from "react";
import { ExtraProps } from "../ProtoTypes/ProtoIO";
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
                style={props.isInput ? io_ul_li_i_input : io_ul_li_i_output}
                onContextMenu={onRightClick}
                ref={ioRef}
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
    updateData: (nodeId: string, input: boolean, index: number, data: any) => void
    children: React.ReactNode
}