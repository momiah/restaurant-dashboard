
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "./screens/Dashboard";
import { useState } from "react";
import Settings from "./screens/Settings";
import HomeHeader from "./components/HomeHeader/HomeHeader";

const Stack = createNativeStackNavigator();

export default function App() {
  const [filter, setFilter] = useState("collection");

  return (
    <NavigationContainer>
      <HomeHeader filter={filter} setFilter={setFilter}/>
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
        {/* Other screens/components */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

