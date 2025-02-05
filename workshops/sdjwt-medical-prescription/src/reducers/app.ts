'use client'
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import SDK from "@hyperledger/identus-edge-agent-sdk";
import { v4 as uuidv4 } from "uuid";
import { DBPreload, Message, Credential, Mediator } from "@/actions/types";
import { acceptCredentialOffer, acceptPresentationRequest, connectDatabase, initAgent, rejectCredentialOffer, sendMessage, startAgent, stopAgent } from "../actions";
import { useMountedApp } from "./store";

const defaultMediatorDID = "did:peer:2.Ez6LSghwSE437wnDE1pt3X6hVDUQzSjsHzinpX3XFvMjRAm7y.Vz6Mkhh1e5CEYYq6JBUcTZ6Cp2ranCWRrv7Yax3Le4N59R6dd.SeyJ0IjoiZG0iLCJzIjp7InVyaSI6Imh0dHA6Ly8xOTIuMTY4LjEuNDQ6ODA4MCIsImEiOlsiZGlkY29tbS92MiJdfX0.SeyJ0IjoiZG0iLCJzIjp7InVyaSI6IndzOi8vMTkyLjE2OC4xLjQ0OjgwODAvd3MiLCJhIjpbImRpZGNvbW0vdjIiXX19";

export type ApiCall = {
    title: string,
    description: string,
    method: string,

    request: (store: Store) => Promise<Response>
    curlCommand: (store: Store) => string
}
export type InteractiveProps = {
    loading: boolean,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    app: ReturnType<typeof useMountedApp>,
    step: Step,
    store: Store,
    messages: SDK.Domain.Message[]
}
export type Component = (props: InteractiveProps) => React.JSX.Element | null;
export type Content = CodeBlock | ApiCall | Component;
export type Store = { [name: string]: any }
export type NextFnProps = {
    store: Store,
    loadAgent: (store: Store) => Promise<SDK.Agent>,
    setNextBusy: React.Dispatch<React.SetStateAction<boolean>>,
    setStore: React.Dispatch<React.SetStateAction<Store>>,
    app: ReturnType<typeof useMountedApp>
}
export type NextFN = (
    options: NextFnProps
) => Promise<void>

export type Step = {
    title: string,
    description: string,
    content: Content[],
    onNext?: NextFN
}

export type CodeBlock = {
    language: string,
    code: string
}


class TraceableError extends Error {

    constructor(...params) {
        super(...params)
    }

    public id = uuidv4();
    static fromError(err: Error) {
        return new TraceableError(err.message);
    }
}

export enum DBStatus {
    "disconnected" = "disconnected",
    "connected" = "connected"
}

const defaultSeed = new SDK.Apollo().createSeed([
    "repeat",
    "spider",
    "frozen",
    "drama",
    "april",
    "step",
    "engage",
    "pitch",
    "purity",
    "arrest",
    "orchard",
    "grocery",
    "green",
    "chapter",
    "know",
    "disease",
    "attend",
    "notable",
    "usage",
    "add",
    "trash",
    "dry",
    "refuse",
    "jewel"

])

export const initialState: RootState = {
    errors: [],
    db: {
        instance: null,
        connected: false,
        isConnecting: false,
        hasConnected: false,
    },
    messages: [],
    connections: [],
    credentials: [],
    mediatorDID: SDK.Domain.DID.fromString(defaultMediatorDID),
    defaultSeed: defaultSeed,
    agent: {
        instance: null,
        hasStarted: false,
        isStarting: false,
        isSendingMessage: false,
        hasSentMessage: false,
        selfDID: null
    }
}

export type ExtendedMessage = SDK.Domain.Message & { isAnswering: boolean; hasAnswered: boolean, error: TraceableError | null }

export type RootState = {
    errors: TraceableError[];
    db: {
        instance: SDK.Domain.Pluto | null,
        connected: boolean
        isConnecting: boolean,
        hasConnected: boolean
    },
    messages: ExtendedMessage[],
    connections: SDK.Domain.DIDPair[],
    credentials: SDK.Domain.Credential[],
    mediatorDID: SDK.Domain.DID,
    defaultSeed: SDK.Domain.Seed,
    agent: {
        instance: SDK.Agent | null,
        selfDID: SDK.Domain.DID | null,
        isStarting: boolean,
        hasStarted: boolean,
        isSendingMessage: boolean,
        hasSentMessage: boolean
    }
};

function removeDuplicates(messages: SDK.Domain.Message[] | SDK.Domain.Credential[]) {
    const uniqueMessages = new Map();
    messages.forEach(message => {
        uniqueMessages.set(message.id, message);
    });
    return Array.from(uniqueMessages.values());
}

const appSlice = createSlice({
    name: "app",
    initialState: initialState,
    reducers: {
        [Mediator.update]: (
            state,
            action: PayloadAction<{
                mediator: string
            }>
        ) => {
            state.mediatorDID = SDK.Domain.DID.fromString(action.payload.mediator)
        },
        [DBPreload.complete]: (
            state,
            action: PayloadAction<{
                messages: SDK.Domain.Message[],
                connections: SDK.Domain.DIDPair[],
                credentials: SDK.Domain.Credential[]
            }>
        ) => {
            state.messages = action.payload.messages as any;
            state.connections = action.payload.connections;
            state.credentials = action.payload.credentials;
        },
        [Credential.success]: (
            state,
            action: PayloadAction<SDK.Domain.Credential>
        ) => {
            state.credentials = removeDuplicates([
                ...state.credentials,
                action.payload,
            ]);
        },
        [Message.success]: (
            state,
            action: PayloadAction<SDK.Domain.Message[]>
        ) => {
            const nonExisting = action.payload.filter((m) => !state.messages.find((d) => d.id === m.id))
            state.messages = removeDuplicates([
                ...action.payload,
                ...state.messages.map((oldMessage) => {
                    if (action.payload.find((m) => m.thid === oldMessage.thid)) {
                        return {
                            ...oldMessage,
                            isAnswering: false,
                            hasAnswered: true
                        }
                    }
                    return oldMessage
                }),
                ...nonExisting
            ]);
        },
        "updateAgent": (
            state,
            action: PayloadAction<{ agent: SDK.Agent, selfDID: SDK.Domain.DID, pluto: SDK.Domain.Pluto }>
        ) => {
            state.agent.isStarting = false;
            state.agent.hasStarted = true;
            state.agent.instance = action.payload.agent;
            state.agent.selfDID = action.payload.selfDID;
            state.db.hasConnected = true;
            state.db.isConnecting = false;
            state.db.instance = action.payload.pluto;
            state.db.connected = true;
        },
    },
    extraReducers: (builder) => {

        builder.addCase(sendMessage.fulfilled, (state, action) => {
            state.agent.isSendingMessage = false;
            state.agent.hasSentMessage = true;
        })

        builder.addCase(sendMessage.pending, (state, action) => {
            state.agent.isSendingMessage = true;
            state.agent.hasSentMessage = false;
            let credentialFormat = SDK.Domain.CredentialType.Unknown;
            try {
                credentialFormat = action.meta.arg.message.credentialFormat;
            }
            catch { }

            state.messages.push({
                ...action.meta.arg.message,
                isAnswering: true,
                hasAnswered: false,
                error: null,
                body: action.meta.arg.message.body,
                credentialFormat
            })
        })

        builder.addCase(sendMessage.rejected, (state, action) => {
            state.agent.isSendingMessage = false;
            state.agent.hasSentMessage = false;
            state.errors.push(TraceableError.fromError(action.payload as Error));
        })

        builder.addCase(stopAgent.fulfilled, (state, action) => {
            state.agent.isStarting = false;
            state.agent.hasStarted = false;
        });

        builder.addCase(stopAgent.rejected, (state, action) => {
            state.agent.isStarting = false;
            state.agent.hasStarted = false;
            state.errors.push(TraceableError.fromError(action.payload as Error));
        });

        builder.addCase(startAgent.pending, (state, action) => {
            state.agent.isStarting = true;
            state.agent.hasStarted = false;
        });

        builder.addCase(startAgent.fulfilled, (state, action) => {
            state.agent.isStarting = false;
            state.agent.hasStarted = true;
            state.agent.instance = action.payload.agent;
            state.agent.selfDID = action.payload.selfDID;
        });

        builder.addCase(startAgent.rejected, (state, action) => {
            state.agent.isStarting = false;
            state.agent.hasStarted = false;
            state.errors.push(TraceableError.fromError(action.payload as Error));
        });

        builder.addCase(initAgent.pending, (state, action) => {
            state.agent.instance = null;
        });

        builder.addCase(initAgent.rejected, (state, action) => {
            state.agent.instance = null;
            state.errors.push(TraceableError.fromError(action.payload as Error));
        });

        builder.addCase(initAgent.fulfilled, (state, action) => {
            state.agent.instance = action.payload.agent;
        });

        builder.addCase(connectDatabase.fulfilled, (state, action) => {
            state.db.hasConnected = true;
            state.db.isConnecting = false;
            state.db.instance = action.payload.db;
            state.db.connected = true;
        });

        builder.addCase(connectDatabase.rejected, (state, action) => {
            state.errors.push(TraceableError.fromError(action.payload as Error));
            state.db.hasConnected = false;
            state.db.isConnecting = false;
            state.db.instance = null;
            state.db.connected = false;
        });

        builder.addCase(connectDatabase.pending, (state) => {
            state.db.hasConnected = false;
            state.db.isConnecting = true;
            state.db.instance = null;
            state.db.connected = false;
        });

        builder.addCase(acceptPresentationRequest.pending, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.map((currentMessage) => {
                if (currentMessage.id === message.id) {
                    return {
                        ...currentMessage,
                        isAnswering: true,
                        hasAnswered: false,
                        error: null
                    }
                }
                return currentMessage
            })
        })

        builder.addCase(acceptPresentationRequest.rejected, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.map((currentMessage) => {
                if (currentMessage.id === message.id) {
                    return {
                        ...currentMessage,
                        isAnswering: false,
                        hasAnswered: false,
                        error: TraceableError.fromError(action.payload as Error)
                    }
                }
                return currentMessage
            })
        })

        builder.addCase(acceptPresentationRequest.fulfilled, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.map((currentMessage) => {
                if (currentMessage.id === message.id) {
                    return {
                        ...currentMessage,
                        isAnswering: false,
                        hasAnswered: true,
                        error: null
                    }
                }
                return currentMessage
            })
        })

        builder.addCase(acceptCredentialOffer.pending, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.map((currentMessage) => {
                if (currentMessage.id === message.id) {
                    debugger;

                    return {
                        ...currentMessage,
                        isAnswering: true,
                        hasAnswered: false,
                        error: null
                    }
                }
                return currentMessage
            })
        })

        builder.addCase(acceptCredentialOffer.rejected, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.map((currentMessage) => {
                if (currentMessage.id === message.id) {
                    return {
                        ...currentMessage,
                        isAnswering: false,
                        hasAnswered: false,
                        error: TraceableError.fromError(action.payload as Error)
                    }
                }
                return currentMessage
            })
        })

        builder.addCase(rejectCredentialOffer.rejected, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.map((currentMessage) => {
                if (currentMessage.id === message.id) {
                    return {
                        ...currentMessage,
                        isAnswering: false,
                        hasAnswered: false,
                        error: TraceableError.fromError(action.payload as Error)
                    }
                }
                return currentMessage
            })
        })

        builder.addCase(rejectCredentialOffer.fulfilled, (state, action) => {
            const message = action.meta.arg.message;
            state.messages = state.messages.filter((currentMessage) => currentMessage.id !== message.id)
        })
    }
});

export default appSlice.reducer;
export const reduxActions = appSlice.actions;
