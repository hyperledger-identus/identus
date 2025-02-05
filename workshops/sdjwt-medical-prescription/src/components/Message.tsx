import SDK from "@hyperledger/identus-edge-agent-sdk";
import { useState } from "react";
import { useMountedApp } from "@/reducers/store";
import { AgentRequire } from "./AgentRequire";
import { Loading } from "./Loading";
import { Credential } from "./Credential";

function MessageTitle(props) {
  const { message, title } = props;
  return <div className="text-xl font-bold">
    <b>{title}: </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
  </div>
}

function CredentialDisplay(props) {
  const { message } = props;
  const attachments = message.attachments.reduce((acc, x) => {
    if ("base64" in x.data) {
      if (x.format === SDK.Domain.AttachmentFormats.JWT) {
        const decoded = Buffer.from(x.data.base64, "base64").toString();
        return acc.concat(
          SDK.JWTCredential.fromJWS(decoded)
        );
      }
      if (x.format === SDK.Domain.AttachmentFormats.SDJWT) {
        const decoded = Buffer.from(x.data.base64, "base64").toString();
        return acc.concat(
          SDK.SDJWTCredential.fromJWS(decoded)
        );
      }
      const decoded = Buffer.from(x.data.base64, "base64").toString();
      try {
        const parsed = JSON.parse(decoded);
        return acc.concat(parsed);
      } catch (err) {

      }
    }
    return acc;
  }, []);

  const attachment = attachments.at(0);
  const parsed = { ...message };
  if (typeof parsed.body === "string") {
    (parsed as any).body = JSON.parse(parsed.body);
  }
  const format = message.attachments?.at(0).format;
  return (
    <div className="w-full mt-5 p-0 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
      <div className="pt-6 px-6">
        <MessageTitle message={message} title={`Credential (${format})`} />
      </div>

      <div className="p-0 space-y-6">
        <Credential credential={attachment} />
      </div>
    </div>
  );
}

function CredentialRequestMessage(message: SDK.Domain.Message) {
  const parsed = { ...message };
  if (typeof parsed.body === "string") {
    (parsed as any).body = JSON.parse(parsed.body);
  }
  const format = parsed.body.formats?.at(0)?.format ?? 'unknown';
  return <div
    className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
  >
    <div>
      <MessageTitle message={message} title="Credential Request" />
      <p>You requested the Credential through this Credential Request Message of type {format}</p>
    </div>
  </div>;
}

const InputFields: React.FC<{ fields: SDK.Domain.InputField[]; }> = props => {
  return <>
    Should proof the following claims:
    {
      props.fields.map((field, i) => {
        return <div key={`field${i}`} >
          <p className=" text-sm font-normal text-gray-500 dark:text-gray-400">
            {
              field.name
            }
            {
              field.filter ? `must match ${JSON.stringify(field.filter)
                }` : ``
            }
          </p>
        </div>;

      })
    }
  </>;
};

function replacePlaceholders(text: string, args: any[]): string {
  return text.replace(/\{(\d+)\}/g, (match, index) => {
    const idx = parseInt(index) - 1; // Adjust for zero-based array index
    return args[idx] !== undefined ? args[idx] : match; // Replace or keep original if undefined
  });
}

export function Message({ message }) {
  const app = useMountedApp();
  const [response, setResponse] = useState<string>("");
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [options, setOptions] = useState<any>({});

  const body = message.body;
  const agent = app.agent.instance;

  const parsed = { ...message };
  if (typeof parsed.body === "string") {
    (parsed as any).body = JSON.parse(message.body);
  }

  const attachments = message.attachments.reduce((acc, x) => {
    if ("base64" in x.data) {
      if (x.format === "prism/jwt") {
        const decodedFirst = Buffer.from(x.data.base64, "base64").toString();
        const decoded = Buffer.from(decodedFirst.split(".")[1], "base64").toString();
        const parsed = JSON.parse(decoded);
        return acc.concat(parsed);
      }
      const decoded = Buffer.from(x.data.base64, "base64").toString();
      try {
        const parsed = JSON.parse(decoded);
        return acc.concat(parsed);
      } catch (err) {

      }
    }
    return acc;
  }, []);

  const handleSend = async () => {
    const text = response;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const from = message?.from as SDK.Domain.DID;
    const to = message?.to as SDK.Domain.DID;
    const thid = message?.thid || message?.id;
    try {
      if (!agent) {
        throw new Error("Start the agent first");
      }
      await agent.sendMessage(
        new SDK.BasicMessage(
          { content: text },
          to,
          from,
          thid
        ).makeMessage()

      );
    }
    catch (e) {
      console.log(e);
    }
  };

  const hasResponse = app.messages.find((appMessage) => {
    if (!message.thid || !appMessage.thid) {
      return false;
    }
    if (appMessage.id === message.id) {
      return false;
    }
    const messageCreatedTime = parseInt(message.createdTime);
    const appMessageCreatedTime = appMessage.createdTime;
    const response = appMessage.thid === message.thid && messageCreatedTime < appMessageCreatedTime;
    return response;
  });

  const isReceived = message.direction !== SDK.Domain.MessageDirection.SENT;

  if (message.piuri === "https://didcomm.org/basicmessage/2.0/message") {
    return <div
      className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
    >
      <div>
        <b>Basic Message: </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
        <p>from {message.from.toString()}</p>
        <p>to {message.to.toString()}</p>
        <pre style={{
          textAlign: "left",
          wordWrap: "break-word",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
        >
          {JSON.stringify(parsed.body.content, null, 2)}
        </pre>
        {attachments.length > 0 && (
          <pre style={{
            textAlign: "left",
            wordWrap: "break-word",
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
          }}
          >
            <b>Attachments:</b>
            {attachments.map(x => JSON.stringify(x, null, 2))}
          </pre>
        )}

      </div>
      {
        message?.isAnswering && <>
          <div role="status">
            <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
            </svg>
            <span className="sr-only">Loading...</span>
          </div>
        </>
      }
      {
        !message?.isAnswering && isReceived && !hasResponse && <AgentRequire>
          <input
            className="block mt-5 p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" type="text" value={response} placeholder="Your response" onChange={(e) => setResponse(e.target.value)} />

          <button className="mt-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
            handleSend();
          }}>Respond</button>
        </AgentRequire>
      }
    </div>;
  }

  if (message.piuri === "https://atalaprism.io/mercury/connections/1.0/request") {
    return <div
      className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
    >
      <div>
        <b>Connection Request: </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
        <pre style={{
          textAlign: "left",
          wordWrap: "break-word",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
        >
          {JSON.stringify(parsed.body, null, 2)}
        </pre>
      </div>

    </div>;
  }

  if (message.piuri === "https://atalaprism.io/mercury/connections/1.0/response") {
    return <div
      className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
    >
      <div>
        <b>Connection established: </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
        <pre style={{
          textAlign: "left",
          wordWrap: "break-word",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
        >
          {JSON.stringify(parsed.body, null, 2)}
        </pre>


      </div>

    </div>;
  }

  if (message.piuri === "https://didcomm.org/issue-credential/3.0/request-credential") {
    return <CredentialRequestMessage {...message} />
  }

  if (message.piuri === "https://didcomm.org/issue-credential/3.0/issue-credential") {
    return <CredentialDisplay message={message} />
  }

  if (message.piuri === "https://didcomm.org/issue-credential/3.0/offer-credential") {
    const data = body.credential_preview.body.attributes.map(({ name }) => name);
    debugger;
    return <div
      className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
    >
      <div>
        <p
          className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
          <b>Credential Offer </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
        </p>

        Credential will contain the following fields
        {
          data.map((field, i) => {
            return <p
              key={`field${i}`}
              className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
              {field}
            </p>;

          })
        }

        {isReceived && !hasResponse && <AgentRequire>
          {
            message?.isAnswering && <>
              <div role="status">
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            </>
          }
          {
            !message.isAnswering && <>
              {
                message?.error && <p>{JSON.stringify(message.error.message)}</p>
              }

              <button className="mt-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
                if (!agent) {
                  throw new Error("Start the agent first");
                }
                app.acceptCredentialOffer({ agent: agent, message: message });
              }}>Accept</button>

              <button className="mt-5 mx-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
                if (!agent) {
                  throw new Error("Start the agent first");
                }
                if (!app.db.instance) {
                  throw new Error("Start the database first");
                }
                app.rejectCredentialOffer({ message: message, pluto: app.db.instance });
              }}>Reject</button>
            </>
          }
        </AgentRequire>}

      </div>
    </div>;
  }

  if (message.piuri === "https://didcomm.atalaprism.io/present-proof/3.0/presentation") {

    return <div
      className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
    >
      <div>
        <p
          className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
          <b>Verification Proof </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
        </p>
        <div
          className="overflow-x-auto h-auto text-sm font-normal text-gray-500dark:text-gray-400">
          <p>You have sent proof in the past to {message.to.toString()}</p>
          <AgentRequire text="to verify a proof">
            <button
              className="mt-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
              style={{ width: 120 }}
              onClick={() => {
                app.agent.instance?.handlePresentation(SDK.Presentation.fromMessage(message))
                  .then((valid) => {
                    setOptions({ valid: valid });
                  })
                  .catch((err) => {
                    setOptions({ valid: false, reason: err.message });
                  });
              }}>
              Verify the Proof
            </button>
            <p>{
              options && <>
                {
                  options.valid === true && <>Presentation is VALID</>
                }
                {
                  options.valid === false && <>Presentation is NOT VALID: {options.reason || 'unknown'} </>
                }
              </>}</p>
          </AgentRequire>
        </div>
      </div>
    </div>;
  }

  if (message.piuri === SDK.ProtocolType.ProblemReporting) {
    const content = replacePlaceholders(message.body.comment, message.body.args);

    return <div className="flex items-center justify-center">
      <div className="w-full bg-red-300 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-lg my-5 w-full">
        <div className="flex">
          <svg
            className="w-6 h-6 text-red-500 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
            ></path>
          </svg>
          <div>
            <p className="font-bold">Error {message.id}</p>
          </div>
        </div>
        <div className="mt-5">
          <div className="w-full shadow-lg bg-white px-10 py-4 rounded-lg">An error ocurred, {content}, CODE {message.body.code}</div>
        </div>
      </div>
    </div>
  }

  if (message.piuri === "https://didcomm.atalaprism.io/present-proof/3.0/request-presentation") {
    const requestPresentationMessage = SDK.RequestPresentation.fromMessage(message);
    const requestPresentation = requestPresentationMessage.decodedAttachments.at(0);
    const requestPresentationFormat = requestPresentationMessage.attachments.at(0)?.format;
    const shouldRespond = isReceived && !hasResponse;



    if (requestPresentationFormat === SDK.Domain.AttachmentFormats.PRESENTATION_EXCHANGE_DEFINITIONS) {

      if (SDK.isPresentationDefinitionRequestType(requestPresentation, SDK.Domain.CredentialType.SDJWT)) {
        const credentials: SDK.Domain.Credential[] = app.credentials.filter((c) => c instanceof SDK.SDJWTCredential);
        const fields: SDK.Domain.InputField[] = requestPresentation.presentation_definition ?
          requestPresentation.presentation_definition.input_descriptors.at(0)?.constraints.fields ?? [] :
          [];

        return <div
          className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
        >
          <div>
            <p
              className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
              <b>SDJWT Verification request </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
            </p>

            <InputFields fields={fields} />

            {shouldRespond && <AgentRequire>
              {
                message.isAnswering && <Loading />
              }
              {
                !message.isAnswering && <>
                  {
                    message.error && <p>{JSON.stringify(message.error.message)}</p>
                  }

                  <button
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                      }
                    }}
                    id="dropdownRadioBgHoverButton"
                    data-dropdown-toggle="dropdownRadioBgHover"
                    style={{ height: 47 }}
                    className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
                    Accept with Credential <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                    </svg>
                  </button>

                  <div id="dropdownRadioBgHover" className={(collapsed ? 'hidden ' : '') + `z-10  bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}>
                    <ul className="px-5 py-3 space-y-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownRadioBgHoverButton">
                      {
                        credentials.map((credential, i) => {
                          const fields = credential.claims.reduce<any>((all, claim) => [
                            ...all,
                            Object.keys(claim).slice(0, 3).join(",")
                          ], []);
                          let credentialText = `Credential with ${fields}`;
                          if (credential.issuer) {
                            credentialText += ` from ${credential.issuer.slice(0, 30)}...`;
                          }
                          return <li key={`cred${i}`}>
                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                              {
                                app.agent.isSendingMessage === false && <button
                                  onClick={() => {
                                    if (!agent) {
                                      throw new Error("Start the agent first");
                                    }
                                    app.acceptPresentationRequest({
                                      agent,
                                      message,
                                      credential
                                    });
                                    setCollapsed(true);
                                  }}
                                >
                                  <span className="ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300 overflow-x-auto h-auto">
                                    {credentialText}
                                  </span>
                                </button>
                              }

                              {
                                app.agent.isSendingMessage === true && <button><Loading /></button>
                              }
                            </div>
                          </li>;
                        })
                      }
                    </ul>
                  </div>

                  <button className="mt-5 mx-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
                    if (!app.db.instance) {
                      throw new Error("Start the db first");
                    }
                    app.rejectCredentialOffer({ message: message, pluto: app.db.instance });
                  }}>Reject</button>
                </>
              }
            </AgentRequire>}

          </div>
        </div>;

      }

      if (SDK.isPresentationDefinitionRequestType(requestPresentation, SDK.Domain.CredentialType.JWT)) {

        const credentials: SDK.Domain.Credential[] = app.credentials.filter((c) => c instanceof SDK.JWTCredential);
        const fields: SDK.Domain.InputField[] = requestPresentation.presentation_definition ?
          requestPresentation.presentation_definition.input_descriptors.at(0)?.constraints.fields ?? [] :
          [];

        return <div
          className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
        >
          <div>
            <p
              className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
              <b>JWT Verification request </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
            </p>

            <InputFields fields={fields} />

            {shouldRespond && <AgentRequire>
              {
                message?.isAnswering && <Loading />
              }
              {
                !message?.isAnswering && <>
                  {
                    message?.error && <p>{JSON.stringify(message.error.message)}</p>
                  }

                  <button
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                      }
                    }}
                    id="dropdownRadioBgHoverButton"
                    data-dropdown-toggle="dropdownRadioBgHover"
                    style={{ height: 47 }}
                    className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
                    Accept with Credential <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                    </svg>
                  </button>

                  <div id="dropdownRadioBgHover" className={(collapsed ? 'hidden ' : '') + `z-10  bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}>
                    <ul className="px-5 py-3 space-y-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownRadioBgHoverButton">
                      {
                        credentials.map((credential, i) => {
                          const fields = credential.claims.reduce<any>((all, claim) => [
                            ...all,
                            Object.keys(claim).slice(0, 3).join(",")
                          ], []);
                          let credentialText = `Credential with ${fields}`;
                          if (credential.issuer) {
                            credentialText += ` from ${credential.issuer.slice(0, 30)}...`;
                          }
                          return <li key={`cred${i}`}>
                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                              {
                                app.agent.isSendingMessage === false && <button
                                  onClick={() => {
                                    if (!agent) {
                                      throw new Error("Start the agent first");
                                    }
                                    app.acceptPresentationRequest({
                                      agent,
                                      message,
                                      credential
                                    });
                                    setCollapsed(true);
                                  }}
                                >
                                  <span className="ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300 overflow-x-auto h-auto">
                                    {credentialText}
                                  </span>
                                </button>
                              }

                              {
                                app.agent.isSendingMessage === true && <button><Loading /></button>
                              }
                            </div>
                          </li>;
                        })
                      }
                    </ul>
                  </div>

                  <button className="mt-5 mx-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
                    if (!app.db.instance) {
                      throw new Error("Start the db first");
                    }
                    app.rejectCredentialOffer({ message: message, pluto: app.db.instance });
                  }}>Reject</button>
                </>
              }
            </AgentRequire>}

          </div>
        </div>;

      }

      if (SDK.isPresentationDefinitionRequestType(requestPresentation, SDK.Domain.CredentialType.AnonCreds)) {
        const credentials = app.credentials;
        const fields =
          Object.keys(requestPresentation.requested_attributes || []).reduce(
            (_, key) => ([
              ..._,
              {
                name: key, path: [key],
              }
            ]), []
          );
        return <div
          className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
        >
          <div>
            <p
              className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
              <b>Anoncreds Verification request </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
            </p>

            <InputFields fields={fields} />

            {shouldRespond && <AgentRequire>
              {
                message?.isAnswering && <Loading />
              }
              {
                !message?.isAnswering && <>
                  {
                    message?.error && <p>{JSON.stringify(message.error.message)}</p>
                  }

                  <button
                    onClick={() => {
                      if (collapsed) {
                        setCollapsed(false);
                      }
                    }}
                    id="dropdownRadioBgHoverButton"
                    data-dropdown-toggle="dropdownRadioBgHover"
                    style={{ height: 47 }}
                    className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
                    Accept with Credential <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                      <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                    </svg>
                  </button>

                  <div id="dropdownRadioBgHover" className={(collapsed ? 'hidden ' : '') + `z-10  bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}>
                    <ul className="px-5 py-3 space-y-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownRadioBgHoverButton">
                      {
                        credentials.map((credential, i) => {
                          const fields = credential.claims.reduce<any>((all, claim) => [
                            ...all,
                            Object.keys(claim).slice(0, 3).join(",")
                          ], []);
                          let credentialText = `Credential with ${fields}`;
                          if (credential.issuer) {
                            credentialText += ` from ${credential.issuer.slice(0, 30)}...`;
                          }
                          return <li key={`cred${i}`}>
                            <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                              {
                                app.agent.isSendingMessage === false && <button
                                  onClick={() => {
                                    if (!agent) {
                                      throw new Error("Start the agent first");
                                    }
                                    app.acceptPresentationRequest({
                                      agent,
                                      message,
                                      credential
                                    });
                                    setCollapsed(true);
                                  }}
                                >
                                  <span className="ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300 overflow-x-auto h-auto">
                                    {credentialText}
                                  </span>
                                </button>
                              }
                              {
                                app.agent.isSendingMessage === true && <button><Loading /></button>
                              }
                            </div>
                          </li>;
                        })
                      }
                    </ul>
                  </div>

                  <button className="mt-5 mx-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
                    if (!app.db.instance) {
                      throw new Error("Start the db first");
                    }
                    app.rejectCredentialOffer({ message: message, pluto: app.db.instance });
                  }}>Reject</button>
                </>
              }
            </AgentRequire>}

          </div>
        </div>;


      }
    } else {

      const verificationType = requestPresentationMessage.attachments.at(0)?.format;
      const credentials: SDK.Domain.Credential[] = app.credentials.filter((credential) => credential.credentialType == verificationType);
      const fields = Object.keys(requestPresentation?.claims ?? {}).map((field) => ({ name: field, path: [`$.${field}`] }))
      return <div
        className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
      >
        <div>
          <p
            className=" text-lg font-normal text-gray-500 lg:text-xl  dark:text-gray-400">
            <b>Cloud Agent [{verificationType?.toUpperCase()}] Verification request </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
          </p>

          <InputFields fields={fields} />

          {shouldRespond && <AgentRequire>
            {
              message?.isAnswering && <Loading />
            }
            {
              !message?.isAnswering && <>
                {
                  message?.error && <p>{JSON.stringify(message.error.message)}</p>
                }

                <button
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                    }
                  }}
                  id="dropdownRadioBgHoverButton"
                  data-dropdown-toggle="dropdownRadioBgHover"
                  style={{ height: 47 }}
                  className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800" type="button">
                  Accept with Credential <svg className="w-2.5 h-2.5 ms-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                  </svg>
                </button>

                <div id="dropdownRadioBgHover" className={(collapsed ? 'hidden ' : '') + `z-10  bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600`}>
                  <ul className="px-5 py-3 space-y-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownRadioBgHoverButton">
                    {
                      credentials.map((credential, i) => {
                        const fields = credential.claims.reduce<any>((all, claim) => [
                          ...all,
                          Object.keys(claim).slice(0, 3).join(",")
                        ], []);
                        let credentialText = `Credential with ${fields}`;
                        if (credential.issuer) {
                          credentialText += ` from ${credential.issuer.slice(0, 30)}...`;
                        }
                        return <li key={`cred${i}`}>
                          <div className="flex items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                            {
                              app.agent.isSendingMessage === false && <button
                                onClick={() => {
                                  if (!agent) {
                                    throw new Error("Start the agent first");
                                  }
                                  app.acceptPresentationRequest({
                                    agent,
                                    message,
                                    credential
                                  });
                                  setCollapsed(true);
                                }}
                              >
                                <span className="ms-2 text-sm font-medium text-gray-900 rounded dark:text-gray-300 overflow-x-auto h-auto">
                                  {credentialText}
                                </span>
                              </button>
                            }
                            {
                              app.agent.isSendingMessage === true && <button><Loading /></button>
                            }
                          </div>
                        </li>;
                      })
                    }
                  </ul>
                </div>

                <button className="mt-5 mx-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900" style={{ width: 120 }} onClick={() => {
                  if (!app.db.instance) {
                    throw new Error("Start the db first");
                  }
                  app.rejectCredentialOffer({ message: message, pluto: app.db.instance });
                }}>Reject</button>
              </>
            }
          </AgentRequire>}

        </div>
      </div>;

    }




    return <>Unsupported {message.piuri}</>;
  }

  return <div
    className="w-full mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 "
  >
    <div>
      <b>Message: </b> {message.id} {message.direction === 1 ? 'received' : 'sent'}
      {message.piuri === "https://atalaprism.io/mercury/connections/1.0/response" && (
        <p>Connection Established with {message.from!.toString()} (Goal: {body.goal})?</p>
      )}
      <pre style={{
        background: "lightBlue",
        textAlign: "left",
        wordWrap: "break-word",
        wordBreak: "break-all",
        whiteSpace: "pre-wrap",
      }}
      >
        {JSON.stringify(parsed, null, 2)}
      </pre>
      {attachments.length > 0 && (
        <pre style={{
          background: "lightCyan",
          textAlign: "left",
          wordWrap: "break-word",
          wordBreak: "break-all",
          whiteSpace: "pre-wrap",
        }}
        >
          <b>Attachments:</b>
          {attachments.map(x => JSON.stringify(x, null, 2))}
        </pre>
      )}
    </div>
  </div>;
}
