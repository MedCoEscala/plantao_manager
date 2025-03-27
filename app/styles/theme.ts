// Definições de cores e outros valores do tema
export const colors = {
  primary: {
    DEFAULT: "#0077B6",
    50: "#E6F3FF",
    100: "#CCE7FF",
    200: "#99CFFF",
    300: "#66B7FF",
    400: "#339FFF",
    500: "#0077B6",
    600: "#0066A3",
    700: "#004D7A",
    800: "#003352",
    900: "#001A29",
  },
  secondary: {
    DEFAULT: "#90E0EF",
    50: "#EEFAFD",
    100: "#DDF6FA",
    200: "#BBECF5",
    300: "#99E3F0",
    400: "#77D9EB",
    500: "#90E0EF",
    600: "#4CCBE2",
    700: "#23B6D2",
    800: "#1B8EA6",
    900: "#13667A",
  },
  text: {
    dark: "#2B2D42",
    light: "#8D99AE",
  },
  background: {
    DEFAULT: "#F8F9FA",
    50: "#FFFFFF",
    100: "#F8F9FA",
    200: "#E9ECEF",
    300: "#DEE2E6",
    400: "#CED4DA",
    500: "#ADB5BD",
  },
  error: {
    DEFAULT: "#E63946",
    50: "#FCE8EA",
    100: "#F9D0D4",
    200: "#F3A1A9",
    300: "#ED727E",
    400: "#E74353",
    500: "#E63946",
    600: "#C51525",
    700: "#94101C",
    800: "#620A12",
    900: "#310509",
  },
  success: {
    DEFAULT: "#2A9D8F",
    50: "#E7F5F3",
    100: "#CFEAE6",
    200: "#9FD6CD",
    300: "#6FC1B4",
    400: "#3FAC9B",
    500: "#2A9D8F",
    600: "#227D72",
    700: "#195E55",
    800: "#103E38",
    900: "#081F1C",
  },
  warning: {
    DEFAULT: "#E9C46A",
    50: "#FCF8EC",
    100: "#F9F1D9",
    200: "#F4E3B3",
    300: "#EED58D",
    400: "#E9C767",
    500: "#E9C46A",
    600: "#E1B138",
    700: "#BC8F20",
    800: "#8C6B18",
    900: "#5B460F",
  },
};

// Espaçamento padrão
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
  40: "160px",
  48: "192px",
  56: "224px",
  64: "256px",
};

// Tipografia
export const fontSizes = {
  xs: "12px",
  sm: "14px",
  base: "16px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  "3xl": "30px",
  "4xl": "36px",
  "5xl": "48px",
  "6xl": "60px",
};

// Bordas
export const borderRadius = {
  none: "0",
  sm: "2px",
  DEFAULT: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  "3xl": "24px",
  full: "9999px",
};

// Sombras
export const shadows = {
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
  none: "none",
};

const theme = {
  colors,
  spacing,
  fontSizes,
  borderRadius,
  shadows,
};

export default theme;
