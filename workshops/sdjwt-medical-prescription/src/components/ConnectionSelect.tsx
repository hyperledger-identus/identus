
import { useMountedApp } from "@/reducers/store";
import SDK from "@hyperledger/identus-edge-agent-sdk";
import React from "react";








export const ConnectionSelect: React.FC<{
    defaultValue?: string,
    label?: string,
    onSelect?: (connection: SDK.Domain.DIDPair) => void,
    onSelectDID?: (did: string) => void
}> = props => {
    const app = useMountedApp();
    const connections = app.connections;

    function onHandleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string) {
        const value = typeof e === "string" ? e : e.target.value;
        if (props.onSelect) {
            const selectedConnection = connections.find((connection) => connection.receiver.toString() === value)
            if (selectedConnection) {
                props.onSelect(selectedConnection)
            }
        }
        if (props.onSelectDID) {
            props.onSelectDID(value)
        }
    }

    if (!connections.length) {
        return <>
            {props.label && <label>{props.label}</label>}
            <input
                value={props.defaultValue}
                className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                onChange={onHandleChange}
            />
        </>
    }


    onHandleChange(connections[0].receiver.toString())

    return <>
        {props.label && <label>{props.label}</label>}
        <select
            value={props.defaultValue}
            onChange={onHandleChange}
            className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            {
                connections.map((connection, i) => {
                    return <option value={connection.receiver.toString()}>{connection.name}</option>
                })
            }
        </select>

    </>;
};
