import { MantineProvider, createTheme, MantineColorsTuple } from "@mantine/core";

const myColor: MantineColorsTuple = [
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

const theme = createTheme({
  colors: {
    SodaGreen: [
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
      "#13716d",
    ],
    myColor,
  },
  primaryColor: "myColor",
  fontSizes: {
    xs: "0.8rem",
    sm: "0.9rem",
    md: "1rem", // (default)
    lg: "1.2rem",
    xl: "1.4rem",
  },
  components: {
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
