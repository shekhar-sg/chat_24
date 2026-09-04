"use client";
import { toggleThemeMode } from "@/store/slices/appConfigSlice";
import { useMediaQuery } from "@mui/material";
import Cookies from "js-cookie";
import { type ReactNode, useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "./";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/config";
import { setUser } from "@/store/slices/authSlice";

export default function StoreProvider({
  children,
  cookieThemeMode,
}: {
  children: ReactNode;
  cookieThemeMode: "dark" | "light" | undefined;
}) {
  const storeRef = useRef<AppStore>(undefined);
  const isDark = useMediaQuery(`(prefers-color-scheme: dark)`, { noSsr: true });
  if (!storeRef.current) {
    storeRef.current = makeStore();
    storeRef.current.dispatch(
      toggleThemeMode({ mode: cookieThemeMode ?? "light" })
    );
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      storeRef.current?.dispatch(setUser(user));
    });
  }, []);

  useEffect(() => {
    if (!Cookies.get("themeMode")) {
      if (storeRef.current) {
        storeRef.current.dispatch(
          toggleThemeMode({ mode: isDark ? "dark" : "light" })
        );
      }
    }
  }, [cookieThemeMode, isDark]);

  return <Provider store={storeRef.current}>{children}</Provider>;
}
