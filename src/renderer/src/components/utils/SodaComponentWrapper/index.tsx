import { MantineProvider, createTheme, MantineColorsTuple } from "@mantine/core";

const paleBlue: MantineColorsTuple = [
  "#ecf4ff",
  "#dce4f5",
  "#b9c7e2",
  "#94a8d0",
  "#748dc0",
  "#5f7cb7",
  "#5474b4",
  "#44639f",
  "#3a5890",
  "#2c4b80",
];

const lightBlue: MantineColorsTuple = [
  "#dffbff",
  "#caf2ff",
  "#99e2ff",
  "#64d2ff",
  "#3cc4fe",
  "#23bcfe",
  "#00b5ff",
  "#00a1e4",
  "#008fcd",
  "#007cb6",
];

const red: MantineColorsTuple = [
  "#ffeaf3",
  "#fcd4e1",
  "#f4a7bf",
  "#ec779c",
  "#e64f7e",
  "#e3366c",
  "#e22862",
  "#c91a52",
  "#b41148",
  "#9f003e",
];

const darkPink: MantineColorsTuple = [
  "#faedff",
  "#edd9f7",
  "#d8b1ea",
  "#c186dd",
  "#ae62d2",
  "#a34bcb",
  "#9d3fc9",
  "#8931b2",
  "#7a2aa0",
  "#6b218d",
];

const theme = createTheme({
  colors: {
    primary: lightBlue, // ✅ register palette as "primary"
  },
  primaryColor: "primary", // ✅ Mantine now uses this as the main brand color
  fontSizes: {
    xs: "0.8rem",
    sm: "0.9rem",
    md: "1rem", // (default)
    lg: "1.2rem",
    xl: "1.4rem",
  },
  components: {
    Paper: {
      styles: {
        root: {},
      },
    },
    Tooltip: {
      styles: {
        root: {
          zIndex: 2999,
        },
      },
    },
    TextInput: {
      styles: {
        error: {
          color: "red",
        },
      },
    },
  },
});

const SodaComponentWrapper = ({ children }) => {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
};

export default SodaComponentWrapper;
