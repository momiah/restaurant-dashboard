import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import styled from "styled-components/native";
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Dashboard from './screens/Dashboard';
import { useState } from 'react';
import AllOrders from './components/AllOrders';
import Settings from './screens/Settings';

const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
      <HomeHeader>
        
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
  height: '10%',
  backgroundColor: '#2c3e50'
});