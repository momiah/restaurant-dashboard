import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, Text } from "react-native";
import { ThemeProvider } from "styled-components/native";
import { useState } from "react";
import Dashboard from "./screens/Dashboard";
import Settings from "./screens/Settings";
import Login from "./screens/Login";
import HomeHeader from "./components/HomeHeader/HomeHeader";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { buildTheme } from "./theme/defaultTheme";

const Stack = createNativeStackNavigator();

function AuthedApp() {
  const { user, restaurant, restaurantId, loading, error } = useAuth();
  const [filter, setFilter] = useState("allOrders");
  const theme = buildTheme(restaurant?.theme);

  if (loading) {
    return (
      <Centered theme={theme}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Centered>
    );
  }

  // Signed out, or signed in but not linked to a restaurant.
  if (!user || !restaurantId) {
    return (
      <ThemeProvider theme={theme}>
        <Login />
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <Centered theme={theme}>
        <Text>{error}</Text>
      </Centered>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <NavigationContainer>
        <HomeHeader filter={filter} setFilter={setFilter} />
        <Stack.Navigator>
          <Stack.Screen name="Dashboard" options={{ headerShown: false }}>
            {(props) => (
              <Dashboard {...props} filter={filter} setFilter={setFilter} />
            )}
          </Stack.Screen>
          <Stack.Screen
            name="Settings"
            component={Settings}
            options={{ headerShown: true }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}

function Centered({ children, theme }) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backgroundColor: theme?.colors?.background || "#ffffff",
      }}
    >
      {children}
    </View>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  );
}
