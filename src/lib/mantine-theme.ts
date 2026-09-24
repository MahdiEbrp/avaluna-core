import { createTheme } from "@mantine/core";
import { UI } from "../config/constants";

export const mantineTheme = createTheme({
  fontFamily: "var(--font-ui)",
  headings: { fontFamily: "var(--font-ui)" },
  defaultRadius: UI.MANTINE_RADIUS,
  primaryColor: "brand",
  colors: {
    brand: [
      "var(--brand-50)",
      "var(--brand-100)",
      "var(--brand-200)",
      "var(--brand-300)",
      "var(--brand-400)",
      "var(--brand-500)",
      "var(--brand-600)",
      "var(--brand-700)",
      "var(--brand-800)",
      "var(--brand-900)",
    ],
  },
  breakpoints: {
    xs: "30em",
    sm: "48em",
    md: "64em",
    lg: "80em",
    xl: "96em",
  },
});
