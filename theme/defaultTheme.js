// Fallback theme, merged under a restaurant's theme config so the dashboard is
// always styled even before the record loads.
export const defaultTheme = {
  colors: {
    primary: "#FF8C00",
    secondary: "#FFC400",
    background: "#ffffff",
    text: "#0a0a0a",
    accent: "#FF8C00",
    navBar: "#2c3e50",
    navBarText: "#ffffff",
  },
  fonts: {
    heading: "System",
    body: "System",
  },
  logoUrl: "",
};

export function buildTheme(restaurantTheme = {}) {
  return {
    ...defaultTheme,
    ...restaurantTheme,
    colors: { ...defaultTheme.colors, ...(restaurantTheme.colors || {}) },
    fonts: { ...defaultTheme.fonts, ...(restaurantTheme.fonts || {}) },
  };
}
