import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AppState {
  token: string | undefined;
}

const initialState: AppState = {
  token: undefined,
};

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearToken: (state) => {
      state.token = undefined;
    },
  },
});

export const { setToken, clearToken } = appSlice.actions;

export default appSlice.reducer;
