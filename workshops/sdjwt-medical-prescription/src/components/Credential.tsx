
import React, { useState } from "react";

import SDK from "@hyperledger/identus-edge-agent-sdk";
import { useMountedApp } from "@/reducers/store";
import { AgentRequire } from "@/components/AgentRequire";


function protect(credential: SDK.Domain.Credential) {
    const newClaims: any[] = []
    credential.claims.forEach((claim) => {
        const newClaim = {}
        Object.keys(claim).forEach((key) => {
            newClaim[key] = "******"
        })
        newClaims.push(newClaim)
    })
    return newClaims
}

export function Credential(props) {
    const { credential } = props;
    const app = useMountedApp();
    const [claims, setClaims] = useState(protect(credential));

    function revealAttributes(credential: SDK.Domain.Credential, claimIndex: number, field: string) {
        app.agent.instance?.pluto.getLinkSecret()
            .then((linkSecret) => {
                app.agent.instance?.revealCredentialFields(
                    credential,
                    [field],
                    linkSecret!.secret
                ).then((revealedFields) => {
                    const revealed = claims.map((claim, index) => {
                        if (claimIndex === index) {
                            return {
                                ...claim,
                                [field]: revealedFields[field]
                            }
                        }
                        return claim
                    })
                    setClaims(revealed)
                })
            })
    }

    return <div className="w-full mt-5  p-6 bg-white rounded-lg shadow dark:bg-gray-800">
        <p className="text-md font-normal text-gray-500 whitespace-normal max-w-full dark:text-gray-400"
            style={{
                textOverflow: 'ellipsis',
                overflow: "hidden"
            }}>
            Issuer {credential.issuer}
        </p>
        <p className="mt-5 text-md font-normal text-gray-500 whitespace-normal max-w-full dark:text-gray-400">
            Claims:
        </p>
        {claims.map((claim, claimIndex) =>
            Object.keys(claim)
                .filter((field) => field !== "id")
                .map((field, i) => (
                    <div
                        key={`field${i}`}
                        className="text-md font-normal text-gray-500 dark:text-gray-400"
                    >
                        {field}
                        <AgentRequire hide text="Revealing attributes requires agent running">
                            {claim[field] === "******" ? (
                                <button
                                    onClick={() => {
                                        revealAttributes(credential, claimIndex, field);
                                    }}
                                    className="m-3 px-3 py-2 text-md font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                >
                                    Reveal
                                </button>
                            ) : (
                                <>: {claim[field]}</>
                            )}
                        </AgentRequire>
                    </div>
                ))
        )}
    </div>

}
