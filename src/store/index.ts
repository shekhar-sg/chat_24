import appConfigSlice from "@/store/slices/appConfigSlice";
import { configureStore } from "@reduxjs/toolkit";
import authSlice from "@/store/slices/authSlice";
import { usersApi } from "@/store/api/userApi";

export const makeStore = () => {
  return configureStore({
    reducer: {
      [appConfigSlice.name]: appConfigSlice.reducer,
      [authSlice.name]: authSlice.reducer,
      [usersApi.reducerPath]: usersApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(usersApi.middleware),
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
