// DashboardNav.js
import React, { useState, useEffect } from "react";
import { TouchableOpacity, Text } from "react-native";
import styled from "styled-components/native";
import DashboardNavConfig from "../components/DashboardNav/DashboardNav.config";
import AllOrders from "../components/AllOrders";
import Icon from 'react-native-vector-icons/Ionicons'
import { db } from "../config/firebase.config";
import { onSnapshot, getDocs, collection } from "firebase/firestore";

const Dashboard = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('allOrders');
  const [showPopup, setShowPopup] = useState(false);

  const filterFunc = (order) => {
    const temp = ["liveOrders", "completedOrders", "stats", "allOrders"]

    return temp.includes(filter) || order.orderType?.toLowerCase() === filter;
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const ordersCollection = collection(db, "orders");
        const ordersSnapshot = await getDocs(ordersCollection);
        const data = ordersSnapshot.docs.map((doc) => doc.data());
        const filteredOrders = data.filter(filterFunc);

        setOrders(filteredOrders);
      } catch (error) {
        console.error(error);
      }
    };

    fetchOrders();
  }, [filter]);

  // add event listener to firestore to listen for new doc adds
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const data = snapshot.docs.map((doc) => doc.data());
      const changes = snapshot.docChanges();
      const filteredOrders = data.filter(filterFunc);
      setOrders(filteredOrders);
      console.log("changes => ", changes[0].doc.data())
      if (changes.length > 0 && changes[0].type === 'added') {
        setShowPopup(true);
      }
    });

    return () => unsubscribe();
  }, [])

  const handlePopupTap = () => {

    setShowPopup(false);
    console.log('tapped', showPopup)
  };

  return (
    <DashboardContainer>
       {showPopup && (
        <PopupContainer onPress={handlePopupTap}>
          <PopupContent>
            <Text style={{fontSize: 50, color: 'white'}}>New Order Received!</Text>
            <Text style={{fontSize: 20, color: 'white'}}>Tap to close</Text>
          </PopupContent>
        </PopupContainer>
      )}
      <NavContainer>
        {DashboardNavConfig.map((item) => (
          <NavItem key={item.id} onPress={() => setFilter(item.id)}>
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        ))}
          <Icon name="settings-outline" color={'white'} size={30} style={{marginLeft: 20, marginTop: 50}} onPress={() => navigation.navigate('Settings')}/>
      </NavContainer>
     
      <AllOrders orders={orders}/>
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

const PopupContainer = styled.TouchableOpacity({
  position: 'absolute',
 width: '90%',
 height: '90%',
 left: '5%',
  backgroundColor: 'rgba(0, 30, 0, 0.9)',
  padding: '20px',
  borderRadius: '10px',
  zIndex: 10
})

const PopupContent = styled.View({
  display: 'flex',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center'
});

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
