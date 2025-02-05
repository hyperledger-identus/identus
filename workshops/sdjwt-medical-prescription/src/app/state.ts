import { atom } from "jotai";
import SDK from "@hyperledger/identus-edge-agent-sdk";

export const mnemonicsAtom = atom<SDK.Domain.MnemonicWordList | undefined>(
  undefined
);
