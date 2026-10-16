import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import baseAPI from "@/utils/config/api";
import appReducer from "@/store/reducer/app";
import "@/store/actions/index";

const rootReducer = combineReducers({
  [baseAPI.reducerPath]: baseAPI.reducer,
  appReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseAPI.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
