import appConfigSlice from "@/store/slices/appConfigSlice";
import { configureStore } from "@reduxjs/toolkit";
import authSlice from "@/store/slices/authSlice";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [appConfigSlice.name]: appConfigSlice.reducer,
      [authSlice.name]: authSlice.reducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
