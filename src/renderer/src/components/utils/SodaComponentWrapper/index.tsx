import { MantineProvider, createTheme, MantineColorsTuple } from "@mantine/core";

const lightBlue: MantineColorsTuple = [
  "#dffbff",
  "#caf2ff",
  "#99e2ff",
  "#64d2ff",
  "#3cc4fe",
  "#23bcfe", // primary shade
  "#00b5ff",
  "#00a1e4",
  "#008fcd",
  "#007cb6",
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
