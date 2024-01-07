
import React, {useState} from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';

const AllOrders = () => {
  const [selectedOrder, setSelectedOrder] = useState(null);

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
    {
      customerName: 'Mohsin Miah',
      orderNumber: 'K0RF1',
      address: '4 Lynton Gardens',
      orderType: 'collection',
      contactNumber: '07874392873',
    },
    {
      customerName: 'John Doe',
      orderNumber: 'ABC122',
      address: '123 Main Street',
      orderType: 'delivery',
      contactNumber: '1234567890',
    },
    // Add more orders as needed
  ];

  const renderOrderItem = ({ item, index }) => {
    const isRowSelected = selectedOrder === index;

    const handleRowPress = () => {
      setSelectedOrder(isRowSelected ? null : index);
    };

    return (
      <>
        <TouchableOpacity onPress={handleRowPress}>
          <Row>
            <Cell>{item.customerName}</Cell>
            <Cell>{item.orderNumber}</Cell>
            <Cell>{item.address}</Cell>
            <Cell>{item.orderType}</Cell>
            <Cell>{item.contactNumber}</Cell>
          </Row>
        </TouchableOpacity>

        {/* Render expanded content if the row is selected */}
        {isRowSelected && (
          <ExpandedContent>
            <ExpandedText>Order Type: {item.orderType}</ExpandedText>
            <ExpandedText></ExpandedText>

            
          </ExpandedContent>
        )}
      </>
    );
  };

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
  flexDirection: 'row',
  marginBottom: 8,
  padding: '10px 10px',
});

const Row = styled.View({
  flexDirection: "row",
  marginBottom: 8,
  padding: "10px 10px",
});

const HeaderText = styled.Text({
  fontWeight: "bold",
  flex: 1,
  textAlign: "left",
});

});

const Cell = styled.Text({
  flex: 1,

  textAlign: 'left',
  padding: '15px 10px',
  border: '1px solid #D9D9D9',
});

const ExpandedContent = styled.View({
  backgroundColor: '#EFEFEF',
  padding: 16,
  border: '1px solid #D9D9D9',
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  height: 300,
  marginBottom: 10
});

const ExpandedText = styled.Text({
  fontWeight: 'bold',
  textAlign: "left",
  padding: "10px 10px",
  border: "1px solid #D9D9D9",
});

export default AllOrders;
