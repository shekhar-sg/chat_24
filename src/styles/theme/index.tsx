import { createTheme, type ThemeOptions } from "@mui/material";

const generateTheme = (
  mode: NonNullable<ThemeOptions["palette"]>["mode"] = "light"
) => {
  const isDarkMode = mode === "dark";
  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDarkMode ? "#fff" : "#000",
        contrastText: isDarkMode ? "#181a20" : "#f4f6fb",
      },
      secondary: {
        main: isDarkMode ? "#2864c5" : "#245cc4",
        contrastText: "#fff",
      },
      background: {
        default: isDarkMode ? "#181a20" : "#f4f6fb",
        paper: isDarkMode ? "#23272f" : "#fff",
      },
      text: {
        primary: isDarkMode ? "#e3e3e3" : "#1a1a1a",
        secondary: isDarkMode ? "#b0b8c1" : "#4f5b62",
      },
      divider: isDarkMode ? "#31363f" : "#e0e0e0",
      error: {
        main: isDarkMode ? "#ff6659" : "#d32f2f",
      },
      success: {
        main: isDarkMode ? "#66bb6a" : "#388e3c",
      },
      warning: {
        main: isDarkMode ? "#ffa726" : "#fbc02d",
      },
      info: {
        main: isDarkMode ? "#29b6f6" : "#0288d1",
      },
      common: {
        black: isDarkMode ? "#0d1117" : "#000",
        white: isDarkMode ? "#e3e3e3" : "#fff",
      },
      grey: {
        50: isDarkMode ? "#1c1f24" : "#fafafa",
        100: isDarkMode ? "#2c2f34" : "#f5f5f5",
        200: isDarkMode ? "#3c3f44" : "#eeeeee",
        300: isDarkMode ? "#4c4f54" : "#e0e0e0",
        400: isDarkMode ? "#5c5f64" : "#bdbdbd",
        500: isDarkMode ? "#6c6f74" : "#9e9e9e",
        600: isDarkMode ? "#7c7f84" : "#757575",
        700: isDarkMode ? "#8c8f94" : "#616161",
        800: isDarkMode ? "#9c9fa4" : "#424242",
        900: isDarkMode ? "#acafb4" : "#212121",
      },
    },
    typography: {
      fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
      h1: { fontWeight: 700, fontSize: "2.2rem" },
      h2: { fontWeight: 600, fontSize: "1.7rem" },
      h3: { fontWeight: 600, fontSize: "1.3rem" },
      body1: { fontSize: "1rem" },
      body2: { fontSize: "0.95rem" },
      button: { textTransform: "none", fontWeight: 600 },
    },
    shape: { borderRadius: 12 },
    components: {},
  });
};

export default generateTheme;
