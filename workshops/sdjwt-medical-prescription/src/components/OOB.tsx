
import { useMountedApp } from "@/reducers/store";
import SDK from "@hyperledger/identus-edge-agent-sdk";
import React, { useCallback, useEffect } from "react";
import { AgentRequire } from "./AgentRequire";

const ListenerKey = SDK.ListenerKey;

export const OOB: React.FC<{ agent: SDK.Agent, pluto: SDK.Domain.Pluto; }> = props => {
    const app = useMountedApp();
    const agent = app.agent.instance;

    const CONNECTION_EVENT = ListenerKey.CONNECTION;
    const [connections, setConnections] = React.useState<Array<any>>([]);
    const [oob, setOOB] = React.useState<string>();
    const [alias, setAlias] = React.useState<string>();

    const handleConnections = useCallback((event: any) => {
        setConnections([...connections, event]);
    }, []);

    useEffect(() => {
        if (agent) {
            agent.addListener(CONNECTION_EVENT, handleConnections);
        }
        return () => {
            if (agent) {
                agent.removeListener(CONNECTION_EVENT, handleConnections);
            }
        }
    }, [agent])

    const handleOnChange = (e: any) => {
        setOOB(e.target.value);
    };

    async function onConnectionHandleClick() {
        if (!oob) {
            return;
        }

        if (!agent) {
            throw new Error("Start the agent first")
        }
        try {
            const parsed = await agent.parseOOBInvitation(new URL(oob));
            await agent.acceptInvitation(parsed, alias);

        } catch (err) {
            if (!alias) {
                return;
            }
            const from = await agent.createNewPeerDID(
                [],
                true
            );
            const resolved = await agent.castor.resolveDID(from.toString());
            const accept = resolved.services.reduce((_, service) => ([..._, ...service.serviceEndpoint.accept]), [])
            const to = SDK.Domain.DID.fromString(oob);
            const message = new SDK.HandshakeRequest({
                accept: accept,
            },
                from,
                to
            );
            await agent.sendMessage(message.makeMessage())
            await agent.connectionManager.addConnection(new SDK.Domain.DIDPair(from, to, alias))
        }

    }

    const connection = connections.at(0);

    return <>
        <h1 className="mb-4 text-lg font-extrabold tracking-tight leading-none text-gray-900  dark:text-white">
            Accept OOB (Connections / Presentations)
        </h1>
        <p className="mb-4 text-md  text-gray-900  dark:text-white">This screen can help you establish a connection with anothe entity, wallet or agent. But also it allows accepting an out of band verification request, when a verifier is asking u to prove him something without a pre-existing connection, what we call "Connectionless presentation".</p>
        <AgentRequire text="Agent required You cannot process an OOB invitation while the agent is not running.">
            <p>
                <input
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Optional name for the connection"
                    type="text"
                    value={alias ?? ""}
                    onChange={(e) => { setAlias(e.target.value) }}
                />
            </p>
            <br />
            <p>
                <input
                    className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Paste out of band connection QRCode here or a DID"
                    type="text"
                    value={oob ?? ""}
                    onChange={handleOnChange}
                />
            </p>
            <button className="my-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={onConnectionHandleClick}>Create connection</button>

        </AgentRequire>
        {!!connection && (
            <>
                <p>Stored Connection as <b>{connection.name}</b></p>
            </>
        )}
    </>;
};
