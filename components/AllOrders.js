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

    return (
      <>
        <Row onPressIn={handleRowPress}>
          <Cell>{item.name}</Cell>
          <Cell>{item.id.slice(-5).toUpperCase()}</Cell>
          <Cell>{item.orderType}</Cell>
          <Cell>£{item.total}</Cell>
        </Row>

        {/* Render expanded content if the row is selected */}
        {isRowSelected && (
          <ExpandedContent>
            <InfoContainer>
              <ExpandedText>
                Order Type:{" "}
                <Text style={{ fontWeight: "normal" }}>{item.orderType}</Text>
              </ExpandedText>
              <ExpandedText>
                Address:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {item.address == "" ? "No Address" : item.address}
                </Text>
              </ExpandedText>
              <ExpandedText>
                Contact Number:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {item.address == "" ? "No Address" : item.address}
                </Text>
              </ExpandedText>
              <ExpandedText>
                Notes:{" "}
                <Text style={{ fontWeight: "normal" }}>
                  {item.address == "" ? "No Address" : item.address}
                </Text>
              </ExpandedText>
            </InfoContainer>

            <OrderContainer>
              {item.orderItems.map((orderItem, index) => {
                const protein = !orderItem.protein
                  ? "NO PROTEIN"
                  : orderItem.protein.toUpperCase();

                return (
                  <View key={index} style={{ marginBottom: 10 }}>
                    <OrderItemContainer>
                      <OrderItem>{orderItem.name}</OrderItem>
                      <OrderItemPrice>£{orderItem.price}</OrderItemPrice>
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
                          <OrderExtras>
                            £{orderItem.extras[0].price.toFixed(2)}
                          </OrderExtras>
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
  height: 500,
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

const OrderContainer = styled.View({
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

const OrderItem = styled.Text({
  marginBottom: 10,
  fontSize: 15,
  fontWeight: "bold",
});
const OrderItemPrice = styled.Text({
  fontSize: 12,
  fontWeight: "bold",
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
