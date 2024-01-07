import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import styled from "styled-components/native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Dashboard from "./screens/Dashboard";
import { useState } from "react";
import AllOrders from "./components/AllOrders";
import Settings from "./screens/Settings";
import Icon from "react-native-vector-icons/Ionicons";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <HomeHeader>
        <OnlineStatusContainer>
          <OnlineStatus>Online</OnlineStatus>
          <GlowingDot />
        </OnlineStatusContainer>
        <HeaderIcons>
          <Icon name="print-outline" color={"white"} size={25} />
          <Icon name="save-outline" color={"white"} size={25} />
        </HeaderIcons>
      </HomeHeader>
      <Stack.Navigator>
        <Stack.Screen
          name="Dashboard"
          component={Dashboard}
          options={{ headerShown: false }}
        />
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

const HomeHeader = styled.SafeAreaView({
  height: "10%",
  backgroundColor: "#2c3e50",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",

});

const OnlineStatusContainer = styled.View({
  flexDirection: "row",
  alignItems: "center",
  border: "2px solid #175900",
  padding: 5,
  marginLeft: 10
});

const OnlineStatus = styled.Text({
  color: "#BAFFA2",

  fontSize: 15,
  textShadowColor: "#BAFFA2",
  textShadowRadius: 1,
});

const GlowingDot = styled.View({
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "green",
  marginLeft: 5, // Adjust the spacing between dot and text
  shadowColor: "green",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: '1px',
  shadowRadius: 5,
});

const HeaderIcons = styled.View({
  flexDirection: "row",
  backgroundColor: "#2c3e50",
  gap: 20,
  marginRight: 30,
});
