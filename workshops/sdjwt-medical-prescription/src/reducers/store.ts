import { Store } from "redux";
import thunk from "redux-thunk";
import { configureStore } from '@reduxjs/toolkit'
import { bindActionCreators } from "redux";
import { useMemo } from "react";

import rootReducer from "./index";

import * as actions from "../actions";

import { RootState, initialState } from "./app";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";


export const store = configureStore({
    reducer: rootReducer,
    devTools: false,
    preloadedState: {
        app: initialState
    },
    middleware: [thunk],
});

export type AppDispatch = typeof store.dispatch;
export const useAppSelector: TypedUseSelectorHook<{ app: RootState }> =
    useSelector;

export const useMountedApp = () => {
    const dispatch = useDispatch<AppDispatch>();
    const dispatchedActions = useMemo(
        () => bindActionCreators(actions, dispatch),
        [dispatch]
    );
    const state = useAppSelector((state) => state.app);
    return {
        ...state,
        ...dispatchedActions,
        dispatch
    };
};

export const wrapper: Store = store;
