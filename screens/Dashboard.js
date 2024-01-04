// DashboardNav.js
import React from "react";
import { TouchableOpacity, Text } from "react-native";
import styled from "styled-components/native";
import DashboardNavConfig from "../components/DashboardNav/DashboardNav.config";
import AllOrders from "../components/AllOrders";
import Icon from 'react-native-vector-icons/Ionicons'


const Dashboard = ({ navigation }) => {
  const handleNavPress = (screen) => {
    // Log to check if the correct screen is being navigated to
    console.log(`Navigating to ${screen}`);
    navigation.navigate(screen);
  };

  return (
    <DashboardContainer>
      <NavContainer>
        {DashboardNavConfig.map((item) => (
          <NavItem key={item.id} onPress={() => handleNavPress(item.screen)}>
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        ))}
          <Icon name="settings-outline" color={'white'} size={30} style={{marginLeft: 20, marginTop: 50}} onPress={() => navigation.navigate('Settings')}/>
      </NavContainer>
     
      <AllOrders/>
    </DashboardContainer>
  );
};

const NavContainer = styled.View({
  flexDirection: "column",
  justifyContent: "flex-start",
  alignItems: "flex-start",
  backgroundColor: "#2c3e50",
  height: "100%",
  width: "20%",
});

const DashboardContainer = styled.View({
  flexDirection: 'row',
  flex: 1
})

const NavItem = styled.TouchableOpacity({
  margin: 0,
  border: "1px solid #414660",
  padding: "35px 20px",
  width: "100%",
});

const NavLabel = styled.Text({
  color: "white",
  fontSize: 15,
});

const SettingsLabel = styled.Text({
  color: "white",
  fontSize: 15,
});

export default Dashboard;
