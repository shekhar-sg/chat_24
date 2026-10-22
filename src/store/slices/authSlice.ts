import type { User } from "firebase/auth";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AuthUser {
  uid: User["uid"];
  email: User["email"];
  displayName: User["displayName"];
  photoURL: User["photoURL"];
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  initialized: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<AuthUser | null>) {
      state.user = action.payload;
      state.loading = false;
      state.initialized = true;
    },

    setAuthLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },

    clearAuth(state) {
      state.user = null;
      state.loading = false;
      state.initialized = true;
    },
  },
});

export const { setUser, setAuthLoading, clearAuth } = authSlice.actions;

export default authSlice;
