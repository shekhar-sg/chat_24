"use client";
import { toggleThemeMode } from "@/store/slices/appConfigSlice";
import { useMediaQuery } from "@mui/material";
import Cookies from "js-cookie";
import { type ReactNode, useEffect, useRef } from "react";
import { Provider } from "react-redux";
import { AppStore, makeStore } from "./";
import { auth } from "@/lib/auth";
import { clearAuth, setUser } from "@/store/slices/authSlice";
import { onAuthStateChanged } from "firebase/auth";

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
      if (user) {
        storeRef.current?.dispatch(
          setUser({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
          })
        );
      } else {
        storeRef.current?.dispatch(clearAuth());
      }
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
