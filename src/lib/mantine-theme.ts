import { createTheme } from "@mantine/core";
import { UI } from "../config/constants";

export const mantineTheme = createTheme({
  fontFamily: "var(--font-ui)",
  defaultRadius: UI.MANTINE_RADIUS,
});
