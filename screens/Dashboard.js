import React, { useState, useEffect, useMemo, useRef } from "react";
import { TouchableOpacity, View, Text, Animated, Easing, Alert } from "react-native";
import styled from "styled-components/native";
import { Ionicons as Icon } from "@expo/vector-icons";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { onSnapshot, collection, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import DashboardNavConfig from "../components/DashboardNav/DashboardNav.config";
import AllOrders from "../components/AllOrders";
import { db } from "../config/firebase.config";
import { useAuth } from "../context/AuthContext";
import { newlyPaid, ordersForView, isCompleted, orderRef } from "../helpers/orders";

const ALARM = require("../assets/new-order-alarm.wav");

// `filter` is the order-type filter from the header (all / collection / delivery);
// `view` is the left-hand nav (live / completed / all).
const Dashboard = ({ navigation, filter }) => {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState("liveOrders");
  // Ids of orders with a status change in flight, so a double tap can't skip a step.
  const [updating, setUpdating] = useState(() => new Set());
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

  const visibleOrders = useMemo(() => ordersForView(orders, view, filter), [orders, view, filter]);
  const liveCount = useMemo(() => orders.filter((o) => !isCompleted(o)).length, [orders]);

  // Move an order to another kitchen step. The rules only allow status/statusTimes
  // changes on this restaurant's paid orders; the customer's order page updates live.
  const setOrderStatus = async (order, status) => {
    if (updating.has(order.id)) return;
    setUpdating((prev) => new Set(prev).add(order.id));
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status,
        [`statusTimes.${status}`]: serverTimestamp(),
      });
    } catch (err) {
      console.error("Order status update failed", err);
      Alert.alert("Couldn't update order", `Order ${orderRef(order)} wasn't updated. Check the connection and try again.`);
    } finally {
      setUpdating((prev) => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

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
          <NavItem key={item.id} onPress={() => setView(item.id)} $active={view === item.id} accessibilityState={{ selected: view === item.id }}>
            <NavLabel>
              {item.label}
              {item.id === "liveOrders" && liveCount > 0 ? ` (${liveCount})` : ""}
            </NavLabel>
          </NavItem>
        ))}
          <Icon name="restaurant-outline" color={'white'} size={30} style={{marginLeft: 20, marginTop: 50}} onPress={() => navigation.navigate('Menu')}/>
          <Icon name="settings-outline" color={'white'} size={30} style={{marginLeft: 20, marginTop: 20}} onPress={() => navigation.navigate('Settings')}/>
      </NavContainer>
     
      <AllOrders
        orders={visibleOrders}
        onSetStatus={setOrderStatus}
        updating={updating}
        emptyMessage={view === "liveOrders" ? "No live orders right now." : "No orders yet."}
      />
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

const NavItem = styled.TouchableOpacity((props) => ({
  margin: 0,
  border: "1px solid #414660",
  padding: "35px 20px",
  width: "100%",
  backgroundColor: props.$active ? "#3d5368" : "transparent",
}));

const NavLabel = styled.Text({
  color: "white",
  fontSize: 15,
});

const SettingsLabel = styled.Text({
  color: "white",
  fontSize: 15,
});

export default Dashboard;
