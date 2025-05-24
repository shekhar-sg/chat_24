import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

export interface AppConfigState {
  themeMode: "light" | "dark";
  isAIChatSidebarOpen: boolean;
}

const initialState: AppConfigState = {
  themeMode: "light",
  isAIChatSidebarOpen: true,
};

const appConfigSlice = createSlice({
  name: "appConfig",
  initialState,
  reducers: {
    toggleThemeMode(
      state,
      action: PayloadAction<
        | {
            mode?: "light" | "dark" | undefined;
            seToCookie?: boolean;
          }
        | undefined
      >
    ) {
      const { payload } = action;
      state.themeMode =
        payload?.mode ?? (state.themeMode === "light" ? "dark" : "light");
      if (payload?.seToCookie) {
        Cookies.set("themeMode", state.themeMode);
      }
    },
    toggleAIChatSidebar(state, action: PayloadAction<boolean | undefined>) {
      if (action.payload !== undefined) {
        state.isAIChatSidebarOpen = action.payload;
      } else {
        state.isAIChatSidebarOpen = !state.isAIChatSidebarOpen;
      }
    },
  },
});

export const { toggleThemeMode, toggleAIChatSidebar } = appConfigSlice.actions;
export default appConfigSlice;
