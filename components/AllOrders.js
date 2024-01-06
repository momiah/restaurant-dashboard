import React, { useState, useEffect } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { db } from "../config/firebase.config";
import styled from "styled-components/native";

// const orders = [
//   {
//     customerName: 'Mohsin Miah',
//     orderNumber: 'K0RFR',
//     address: '4 Lynton Gardens',
//     orderType: 'collection',
//     contactNumber: '07874392873',
//   },
//   {
//     customerName: 'John Doe',
//     orderNumber: 'ABC123',
//     address: '123 Main Street',
//     orderType: 'delivery',
//     contactNumber: '1234567890',
//   },
//   {
//     customerName: 'Mohsin Miah',
//     orderNumber: 'K0RF1',
//     address: '4 Lynton Gardens',
//     orderType: 'collection',
//     contactNumber: '07874392873',
//   },
//   {
//     customerName: 'John Doe',
//     orderNumber: 'ABC122',
//     address: '123 Main Street',
//     orderType: 'delivery',
//     contactNumber: '1234567890',
//   },
//   // Add more orders as needed
// ];

const AllOrders = ({ orders }) => {

  const renderOrderItem = ({ item }) => (
    <Row>
      <Cell>{item.name}</Cell>
      <Cell>{item.orderNumber}</Cell>
      <Cell>{item.address}</Cell>
      <Cell>{item.orderType}</Cell>
      <Cell>{item.contactNumber}</Cell>
    </Row>
  );

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderText>Customer Name</HeaderText>
        <HeaderText>Order Number</HeaderText>
        <HeaderText>Address</HeaderText>
        <HeaderText>Order Type</HeaderText>
        <HeaderText>Contact Number</HeaderText>
      </Header>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
      />
    </Container>
  );
};

const Container = styled.View({
  width: "100%",
  flex: 1,
  padding: 16,
});

const Header = styled.View({
  flexDirection: "row",
  marginBottom: 8,
  padding: "10px 10px",
});

const HeaderText = styled.Text({
  fontWeight: "bold",
  flex: 1,
  textAlign: "left",
});

const Row = styled.View({
  flexDirection: "row",
});

const Cell = styled.Text({
  flex: 1,
  textAlign: "left",
  padding: "10px 10px",
  border: "1px solid #D9D9D9",
});

export default AllOrders;
