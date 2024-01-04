import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import styled from 'styled-components/native';

const AllOrders = () => {
  const orders = [
    {
      customerName: 'Mohsin Miah',
      orderNumber: 'K0RFR',
      address: '4 Lynton Gardens',
      orderType: 'collection',
      contactNumber: '07874392873',
    },
    {
      customerName: 'John Doe',
      orderNumber: 'ABC123',
      address: '123 Main Street',
      orderType: 'delivery',
      contactNumber: '1234567890',
    },
    // Add more orders as needed
  ];

  const renderOrderItem = ({ item }) => (
    <Row>
      <Cell>{item.customerName}</Cell>
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
        keyExtractor={(item) => item.orderNumber}
      />
    </Container>
  );
};

const Container = styled.View({

  width: '100%',
    flex: 1,
    padding: 16,
})

const Header = styled.View({
    flexDirection: 'row',
    marginBottom: 8,
})

const HeaderText = styled.Text({
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
})

const Row = styled.View({
    flexDirection: 'row',
    marginBottom: 8,
})

const Cell = styled.Text({
    flex: 1,
    textAlign: 'center',
})

export default AllOrders;
