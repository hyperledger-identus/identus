import { Box } from "@/app/Box";
import { useMountedApp } from "@/reducers/store";
import React from "react";
import { DBConnect } from "./DBConnect";

export const BackupRestore: React.FC = () => {
  const app = useMountedApp();
  const agent = app.agent.instance;
  const [backup, setBackup] = React.useState("");
  const [restore, setRestore] = React.useState("");

  const handleBackup = async () => {
    const jwe = await agent?.backup.createJWE();

    if (typeof jwe === "string") {
      console.log(jwe);
      setBackup(jwe);
    }
  };

  const handlerestore = async () => {
    await agent?.backup.restore(restore);
    console.log("Data restored")
  }

  return (
    <Box>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
        Backup & Restore
      </h1>

      <div className="flex">
        <DBConnect>
          <div className="w-1/2 mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">

            <button
              className="my-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
              onClick={handleBackup}
            >
              Create Backup JWE
            </button>

          </div>
          <div className="w-1/2 mt-5 p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
            <label htmlFor="mediatordid">JWE</label>
            <input
              id="jwe"
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              value={restore}
              onChange={e => setRestore(e.target.value)}
            />
            <button
              className="my-5 inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
              onClick={handlerestore}
            >
              Restore JWE
            </button>
          </div>
        </DBConnect>
      </div>
    </Box>
  );
};
