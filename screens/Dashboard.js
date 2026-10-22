import React, { useState, useEffect, useMemo, useRef } from "react";
import { TouchableOpacity, View, Text, Animated, Easing } from "react-native";
import styled from "styled-components/native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { onSnapshot, collection, query, where } from "firebase/firestore";
import DashboardNavConfig from "../components/DashboardNav/DashboardNav.config";
import AllOrders from "../components/AllOrders";
import { db } from "../config/firebase.config";
import { useAuth } from "../context/AuthContext";
import { isPaid, newlyPaid } from "../helpers/orders";

const ALARM = require("../assets/new-order-alarm.wav");
// Nav filters that show every order rather than filtering by order type.
const SHOW_ALL = ["liveOrders", "completedOrders", "stats", "allOrders"];

const Dashboard = ({ navigation, filter, setFilter }) => {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const pulseValue = useRef(new Animated.Value(1)).current;
  // Ids of paid orders we already know about; null until the first snapshot lands.
  const seenPaid = useRef(null);

  const alarm = useAudioPlayer(ALARM);

  // A kitchen tablet must ring even with the silent switch on.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  useEffect(() => {
    alarm.loop = true;
    if (showPopup) {
      alarm.seekTo(0);
      alarm.play();
    } else {
      alarm.pause();
    }
  }, [showPopup, alarm]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, { toValue: 1.015, duration: 500, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(pulseValue, { toValue: 1, duration: 500, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    if (showPopup) animation.start();
    return () => animation.stop();
  }, [showPopup, pulseValue]);

  // One live subscription to this restaurant's orders. Only Stripe-confirmed (paid)
  // orders reach the kitchen; the alarm sounds when an order newly becomes paid,
  // never for orders that already existed when the app opened.
  useEffect(() => {
    if (!restaurantId) return undefined;
    seenPaid.current = null;
    const q = query(collection(db, "orders"), where("restaurantId", "==", restaurantId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
        const { paid, fresh, seen } = newlyPaid(all, seenPaid.current);
        seenPaid.current = seen;
        setOrders(paid);
        if (fresh.length > 0) setShowPopup(true);
      },
      (err) => console.error("Order feed error", err)
    );
    return unsubscribe;
  }, [restaurantId]);

  const visibleOrders = useMemo(
    () => (SHOW_ALL.includes(filter) ? orders : orders.filter((o) => o.orderType?.toLowerCase() === filter)),
    [orders, filter]
  );

  const handlePopupTap = () => setShowPopup(false);

  return (
    <DashboardContainer>
      {showPopup && (
        <Animated.View style={[styles.popupContainer, { transform: [{ scale: pulseValue }] }]}>
          <TouchableOpacity onPress={handlePopupTap}>
            <View style={styles.popupContent}>
            <Text style={{fontSize: 50, color: 'white'}}>New Order Received!</Text>
            <Text style={{fontSize: 20, color: 'white'}}>Tap to close</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
      <NavContainer>
        {DashboardNavConfig.map((item) => (
          <NavItem key={item.id} onPress={() => setFilter(item.id)}>
            <NavLabel>{item.label}</NavLabel>
          </NavItem>
        ))}
          <Icon name="restaurant-outline" color={'white'} size={30} style={{marginLeft: 20, marginTop: 50}} onPress={() => navigation.navigate('Menu')}/>
          <Icon name="settings-outline" color={'white'} size={30} style={{marginLeft: 20, marginTop: 20}} onPress={() => navigation.navigate('Settings')}/>
      </NavContainer>
     
      <AllOrders orders={visibleOrders}/>
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

const styles = {
  popupContainer: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    left: '5%',
     backgroundColor: 'rgba(0, 30, 0, 0.9)',
     padding: 20,
     borderRadius: 10,
     zIndex: 10
  },
  popupContent: {
    display: 'flex',
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center'
  }
};

// const PopupContainer = styled.TouchableOpacity({
//   position: 'absolute',
//  width: '90%',
//  height: '90%',
//  left: '5%',
//   backgroundColor: 'rgba(0, 30, 0, 0.9)',
//   padding: '20px',
//   borderRadius: '10px',
//   zIndex: 10
// })

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
