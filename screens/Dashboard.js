// DashboardNav.js
import React, { useState, useEffect } from "react";
import { TouchableOpacity, View, Text, Animated, Easing } from 'react-native';
import styled from "styled-components/native";
import DashboardNavConfig from "../components/DashboardNav/DashboardNav.config";
import AllOrders from "../components/AllOrders";
import Icon from 'react-native-vector-icons/Ionicons'
import { db } from "../config/firebase.config";
import { onSnapshot, getDocs, collection } from "firebase/firestore";
import { Audio } from 'expo-av';

const Dashboard = ({ navigation, filter, setFilter }) => {
  const [orders, setOrders] = useState([]);

  const [showPopup, setShowPopup] = useState(false);
  const pulseValue = new Animated.Value(1);

  const [sound, setSound] = useState();

  useEffect(() => {
    // Load the sound file
    const loadSound = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/security-alarm-63578.mp3')
      );
      setSound(sound);
    };

    loadSound();

    // Clean up the sound
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (showPopup && sound) {
      // Play the sound when the popup is visible
      sound.playAsync();
    } else if (!showPopup && sound) {
      // Stop the sound when the popup is closed
      sound.stopAsync();
    }
  }, [showPopup, sound]);


  useEffect(() => {
    let animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.015,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 500,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ]),
      { iterations: -1 } // -1 indicates infinite iterations
    );
  
    if (showPopup) {
      animation.start();
    } else {
      animation.stop();
    }
  
    return () => {
      animation.stop();
    };
  }, [showPopup]);
  
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
      // console.log("changes => ", changes[0].doc.data())
      if (changes.length > 0 && changes[0].type === 'added') {
        setShowPopup(true);
      }
    });

    return () => unsubscribe();
  }, [])

  const handlePopupTap = () => {
    setShowPopup(false);
  };

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

const styles = {
  popupContainer: {
    position: 'absolute',
    width: '90%',
    height: '90%',
    left: '5%',
     backgroundColor: 'rgba(0, 30, 0, 0.9)',
     padding: '20px',
     borderRadius: '10px',
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
