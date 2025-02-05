'use client'
import React, { useEffect, useLayoutEffect, useState } from "react";
import SDK from "@hyperledger/identus-edge-agent-sdk";

import '../app/index.css';
import { useMountedApp } from "@/reducers/store";
import { reduxActions, Step, Store, } from "@/reducers/app";
import dynamic from "next/dynamic";
import { ApiCallComponent } from "@/components/ApiCallComponent";
import { InteractiveComponent } from "@/components/InteractiveComponent";
import { MEDIATOR_URL } from "@/config";
import Step1 from "@/steps/Step1";
import Step2 from "@/steps/Step2";
import Step3 from "@/steps/Step3";
import Step4 from "@/steps/Step4";
import Step5 from "@/steps/Step5";
import Step6 from "@/steps/Step6";
import { loadAgent } from "@/utils/loadAgent";

const CodeComponent = dynamic(() => import('@/components/CodeEditor').then((e) => e.CodeComponent), {
    ssr: false,
});

const Sample: React.FC<{}> = props => {
    const app = useMountedApp()
    const [loading, setLoading] = useState<boolean>(false)
    const messages = app.messages;
    const [store, setStore] = useState<Store>({})
    const [currentStep, setCurrentStep] = useState(0);
    const [nextBusy, setNextBusy] = useState<boolean>(false);

    useLayoutEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentStep])

    const agent = app.agent.instance;
    const credentials = app.credentials;
    const steps: Step[] = [
        Step1,
        Step2,
        Step3,
        Step4,
        Step5,
        Step6
    ];
    const step = steps[currentStep];

    async function handleNext() {
        if (step.onNext) {
            await step.onNext({
                store,
                loadAgent,
                setNextBusy,
                setStore,
                app
            })
        }
        setCurrentStep((prev) => prev + 1)
    }

    function onResponse(response: any, uri: string) {
        if (typeof response === "string") {
            setStore({
                ...store,
                [uri]: response
            })
        } else {
            setStore({
                ...store,
                ...response
            })
        }

    }

    useEffect(() => {
        async function messageEvent(newMessages) {
            if (agent) {
                app.dispatch(
                    reduxActions.messageSuccess(
                        newMessages
                    )
                )
                setLoading(false)
                const issuedCredentials = newMessages.filter((message) => message.piuri === "https://didcomm.org/issue-credential/3.0/issue-credential");
                if (issuedCredentials.length) {
                    for (const issuedCredential of issuedCredentials) {
                        const issueCredential = SDK.IssueCredential.fromMessage(issuedCredential);
                        const credential = await agent.processIssuedCredentialMessage(issueCredential);
                        app.dispatch(
                            reduxActions.credentialSuccess(
                                credential
                            )
                        )
                    }
                }
            }
        }
        if (agent) {
            agent.addListener(SDK.ListenerKey.MESSAGE, messageEvent)
        }
        return () => {
            if (agent) {
                agent.removeListener(SDK.ListenerKey.MESSAGE, messageEvent)
            }
        }
    }, [agent])

    return (
        <div className="w-full p-8 font-sans bg-gray-50 min-h-screen">
            <div>
                <img
                    src="https://cdn.jsdelivr.net/gh/hyperledger/identus@v2.13/resources/images/hyperledger-identus.svg"
                    alt="identus-logo" width="513px" height="99px" style={{ margin: '0 auto' }}
                />
                <h2 className="text-6xl mb-4 text-blue-700 text-center">
                    SDJWT Workshop
                </h2>
            </div>
            <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-lg max-w-5xl mx-auto">
                <h2 className="text-2xl font-semibold mb-4 text-blue-700">
                    {step.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                    {step.description}
                </p>
                {
                    step.content.map((content, i) => <div key={`step${currentStep}Content${i}`}>
                        {
                            "language" in content &&
                            <CodeComponent content={content} />
                        }
                        {
                            "curlCommand" in content &&
                            <ApiCallComponent
                                store={store}
                                content={content}
                                onResponse={onResponse} />
                        }
                        {
                            typeof content === "function" &&
                            <InteractiveComponent
                                content={content}
                                props={{
                                    step,
                                    store,
                                    loading,
                                    setLoading,
                                    app,
                                    messages
                                }}
                            />
                        }
                    </div>)
                }
                {/* Navigation Buttons */}
                <div className="flex justify-end mt-10">
                    <button
                        className={`px-4 py-2 ${nextBusy ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded-lg  transition duration-200 disabled:opacity-50`}
                        onClick={handleNext}
                        disabled={
                            currentStep === steps.length - 1 ||
                            nextBusy ||
                            (currentStep === 1 && !store.guid) ||
                            (currentStep === 2 && !store[`${MEDIATOR_URL}/did`]) ||
                            (currentStep === 3 && credentials.length <= 0) ||
                            (currentStep === 4 && (!store.status || store.status !== "PresentationVerified"))
                        }
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sample;
