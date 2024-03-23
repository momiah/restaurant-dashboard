import React from 'react'
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import styled from "styled-components/native";
import Icon from "react-native-vector-icons/Ionicons";

const RadioButton = ({ label, filterType, currentFilter, onPress }) => {
    return (
      <FilterContainer onPress={() => onPress(filterType)}>
        <Text style={{ color: "white", marginRight: 3 }} >{label}</Text>
        {currentFilter === filterType ? (
          <Icon name="radio-button-on" color={"orange"} size={15} />
        ) : (
          <Icon name="radio-button-off" color={"white"} size={15} />
        )}
      </FilterContainer>
    );
  };

const HomeHeader = ({filter, setFilter}) => {
    
    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
      };

  return (
    <HomeHeaderContainer>
    <OnlineStatusContainer>
      <OnlineStatus>Online</OnlineStatus>
      <GlowingDot />
    </OnlineStatusContainer>
    <HeaderIcons>
      <RadioButton
        label="All Orders"
        filterType="allOrders"
        currentFilter={filter}
        onPress={handleFilterChange}
      />
      <RadioButton
        label="Collection"
        filterType="collection"
        currentFilter={filter}
        onPress={handleFilterChange}
      />
      <RadioButton
        label="Delivery"
        filterType="delivery"
        currentFilter={filter}
        onPress={handleFilterChange}
      />
      <Icon name="print-outline" color={"white"} size={25} />
      <Icon name="save-outline" color={"white"} size={25} />
    </HeaderIcons>
  </HomeHeaderContainer>
  )
}


const HomeHeaderContainer = styled.SafeAreaView({
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
    marginLeft: 10,
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
    shadowOpacity: 1,
    shadowRadius: 5,
  });
  
  const HeaderIcons = styled.View({
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2c3e50",
    gap: 20,
    marginRight: 30,
  });
  
  const FilterContainer = styled.TouchableOpacity({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    margin: "0 20px",
  });
  
  export default HomeHeader