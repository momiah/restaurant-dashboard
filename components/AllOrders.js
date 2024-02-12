import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { db } from "../config/firebase.config";
import styled from "styled-components/native";

const AllOrders = ({ orders }) => {
  const [selectedOrder, setSelectedOrder] = useState(null);

  const renderOrderItem = ({ item, index }) => {
    // console.log(item);
    const isRowSelected = selectedOrder === index;

    const handleRowPress = () => {
      setSelectedOrder(isRowSelected ? null : index);
      // console.log("selectedRow", isRowSelected);
    };

    const numberOfItems = item.orderItems.map(item => item.quantity).reduce((currentValue, accumulator) => currentValue + accumulator, 0)

    return (
      <>
        <Row onPressIn={handleRowPress}>
          <Cell>{item.name}</Cell>
          <Cell>{item.id.slice(-5).toUpperCase()}</Cell>
          <Cell>{item.orderType}</Cell>
          <Cell>£{item.total.toFixed(2)}</Cell>
        </Row>

        {/* Render expanded content if the row is selected */}
        {isRowSelected && (
          <ExpandedContent>
            <InfoContainer>
              <ExpandedText>
                Order Type:{" "}
                <Text style={{ fontWeight: "normal" }}>{item.orderType}</Text>
              </ExpandedText>
              {item.address && (
                <ExpandedText>
                  Address:{" "}
                  <Text
                    style={{
                      fontWeight: "normal",
                      color: !item.address ? "#4B4B4B" : "black",
                    }}
                  >
                    {item.address == "" ? "No address" : item.address}
                  </Text>
                </ExpandedText>
              )}

              <ExpandedText>
                Contact Number:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {item.contactNumber == ""
                    ? "No Contact Number"
                    : item.contactNumber}
                </Text>
              </ExpandedText>
              {item.notes && (
                <ExpandedText>
                  Notes:{" "}
                  <Text style={{ fontWeight: "normal" }}>
                    {item.address == "" ? "No Notes" : item.notes}
                  </Text>
                </ExpandedText>
              )}
            </InfoContainer>

            <OrderContainer>
              <NumberOfItemContainer>
                <Text style={{fontWeight: 'bold'}}>Number of Items</Text>
                <Text style={{fontWeight: 'bold'}}>{numberOfItems}</Text>
              </NumberOfItemContainer>
              {item.orderItems.map((orderItem, index) => {
                const protein = !orderItem.protein
                  ? "NO PROTEIN"
                  : orderItem.protein.toUpperCase();

                return (
                  <View key={index} style={{ marginBottom: 10 }}>
                    <OrderItemContainer>
                      <OrderItem>{orderItem.name}  x{orderItem.quantity}</OrderItem>
                      <OrderItemPrice>£{orderItem.price * orderItem.quantity}</OrderItemPrice>
                    </OrderItemContainer>

                    {orderItem.extras && orderItem.extras.length > 0 ? (
                      <ExtrasContainer>
                        <OrderProtein style={{ fontWeight: "bold" }}>
                          {protein}
                        </OrderProtein>
                        <View
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "space-between",
                          }}
                        >
                          <OrderExtras>{orderItem.extras[0].type}</OrderExtras>
            
                        </View>
                      </ExtrasContainer>
                    ) : (
                      <NoExtrasContainer>
                        <OrderProtein> {protein}</OrderProtein>
                      </NoExtrasContainer>
                    )}
                  </View>
                );
              })}
            </OrderContainer>
            <CustomerProfile></CustomerProfile>
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
        <HeaderText>Order Type</HeaderText>
        <HeaderText>Price</HeaderText>
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
  padding: "10px 3px",
});

const Row = styled.TouchableOpacity({
  flexDirection: "row",
});

const HeaderText = styled.Text({
  fontWeight: "bold",
  flex: 1,
  textAlign: "left",
});

const Cell = styled.Text({
  flex: 1,
  textAlign: "left",
  padding: "20px 10px",
  border: "1px solid #D9D9D9",
});

const ExpandedContent = styled.View({
  flexDirection: "row",
  backgroundColor: "#EFEFEF",
  padding: 16,
  border: "1px solid #D9D9D9",
  borderBottomLeftRadius: 20,
  borderBottomRightRadius: 20,
  minHeight: 500,
  marginBottom: 15,
});

const ExpandedText = styled.Text({
  fontWeight: "bold",
  textAlign: "left",
  padding: "10px 10px",
});

const InfoContainer = styled.View({
  border: "1px solid #D9D9D9",
  width: "30%",
});

const OrderContainer = styled.ScrollView({
  border: "1px solid #D9D9D9",
  width: "35%",
  padding: 10,
});
const CustomerProfile = styled.View({
  border: "1px solid #D9D9D9",
  width: "35%",
  padding: 10,
});

const OrderItemContainer = styled.View({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingRight: 10,
});

const NumberOfItemContainer = styled.View({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  paddingRight: 10,
  marginBottom: 20,
  paddingBottom: 10,
  borderBottomColor: "#D9D9D9",
  borderBottomWidth: 1,
});

const OrderItem = styled.Text({
  marginBottom: 10,
  fontSize: 15,
  fontWeight: "bold",
});
const OrderItemPrice = styled.Text({
  fontSize: 12,
  fontWeight: "bold",
  paddingBottom: 10
});

const ExtrasContainer = styled.View({
  borderLeftWidth: 1,
  borderColor: "#BBBBBB",
  padding: "0px 10px 10px",
  marginLeft: 15,
});
const NoExtrasContainer = styled.View({
  borderLeftWidth: 1,
  borderColor: "#BBBBBB",
  padding: "0px 10px 0px",
  marginLeft: 15,
});
const OrderExtras = styled.Text({
  marginBottom: 10,
  marginTop: 10,
  fontSize: 10,
  display: "flex",
  justifyContent: "space-between",
});
const OrderProtein = styled.Text({
  marginBottom: 10,
  marginTop: 10,
  fontSize: 10,
  display: "flex",
  justifyContent: "space-between",
  fontWeight: "bold",
});

export default AllOrders;
