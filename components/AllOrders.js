import React, { useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import styled from "styled-components/native";
import { nextAction, orderRef, orderStep, previousStep, statusLabel } from "../helpers/orders";

const STATUS_COLOURS = {
  placed: "#D64545",
  preparing: "#E08A00",
  ready: "#2D6CDF",
  completed: "#3B8C3B",
};

// The big "next step" button. Kitchen staff tap this during service, so it's large
// and disabled while the update is in flight.
const NextStepButton = ({ order, onSetStatus, busy, large }) => {
  const action = nextAction(order);
  if (!action) return <DoneText>Done</DoneText>;
  return (
    <ActionButton
      $large={large}
      disabled={busy}
      onPress={() => onSetStatus(order, action.status)}
      accessibilityRole="button"
      accessibilityLabel={`${action.label}, order ${orderRef(order)}`}
    >
      {busy ? <ActivityIndicator color="#fff" /> : <ActionText $large={large}>{action.label}</ActionText>}
    </ActionButton>
  );
};

const AllOrders = ({ orders, onSetStatus = () => {}, updating = new Set(), emptyMessage = "No orders yet." }) => {
  // Track the open row by order id: the list re-sorts as orders move between steps.
  const [selectedId, setSelectedId] = useState(null);

  const renderOrderItem = ({ item }) => {
    const isRowSelected = selectedId === item.id;
    const busy = updating.has(item.id);
    const step = orderStep(item);
    const undoTo = previousStep(item);

    const handleRowPress = () => {
      setSelectedId(isRowSelected ? null : item.id);
    };

    const numberOfItems = (item.orderItems || [])
      .map((item) => item.quantity)
      .reduce((currentValue, accumulator) => currentValue + accumulator, 0);

    return (
      <>
        <RowContainer>
          <Row onPress={handleRowPress} accessibilityLabel={`Order ${orderRef(item)}`}>
            <Cell style={{ fontWeight: "bold" }}>{orderRef(item)}</Cell>
            <Cell>{item.name}</Cell>
            <Cell>{item.orderType}</Cell>
            <Cell>£{Number(item.total || 0).toFixed(2)}</Cell>
            <StatusCell>
              <StatusPill style={{ backgroundColor: STATUS_COLOURS[step] }}>
                <StatusText>{statusLabel(item)}</StatusText>
              </StatusPill>
            </StatusCell>
          </Row>
          <ActionCell>
            <NextStepButton order={item} onSetStatus={onSetStatus} busy={busy} />
          </ActionCell>
        </RowContainer>

        {/* Render expanded content if the row is selected */}
        {isRowSelected && (
          <ExpandedContent>
            <InfoContainer>
              <ExpandedText>
                Order Type:{" "}
                <Text style={{ fontWeight: "normal" }}>{item.orderType}</Text>
              </ExpandedText>
              <ExpandedText>
                Created At:{" "}
                <Text style={{ fontWeight: "normal" }}>{item.createdAt}</Text>
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
                    {item.notes == "" ? "No Notes" : item.notes}
                  </Text>
                </ExpandedText>
              )}
            </InfoContainer>

            <OrderContainer>
              <NumberOfItemContainer>
                <Text style={{ fontWeight: "bold" }}>Number of Items</Text>
                <Text style={{ fontWeight: "bold" }}>{numberOfItems}</Text>
              </NumberOfItemContainer>
              {(item.orderItems || []).map((orderItem, index) => {
                const proteins = [
                  {
                    type: "Protein #1",
                    protein: orderItem.protein,
                  },
                  {
                    type: "Protein #2",
                    protein: orderItem.secondProtein,
                  },
                  {
                    type: "Protein #3",
                    protein: orderItem.thirdProtein,
                  },
                ];

                const extrasPrice = (orderItem.extras || [])
                  .map((extra) => Number(extra.price) || 0)
                  .reduce((acc, currentVal) => acc + currentVal, 0);

                const originalPrice =
                  (orderItem.price - extrasPrice) * orderItem.quantity;

                return (
                  <View key={index} style={{ marginBottom: 10 }}>
                    <OrderItemContainer>
                      <OrderItem>
                        {orderItem.name} ({orderItem.quantity})
                      </OrderItem>
                      <OrderItemPrice>
                        £{originalPrice.toFixed(2)}
                      </OrderItemPrice>
                    </OrderItemContainer>

                    {orderItem.extras && orderItem.extras.length > 0 ? (
                      <ExtrasContainer>
                        {proteins.map((protein, index) => {
                          const proteinValue = protein.protein
                            ? protein.protein.toUpperCase()
                            : null;
                          return (
                            proteinValue !== null && (
                              <OrderProtein
                                key={index}
                                style={{ fontWeight: "bold" }}
                              >
                                {proteinValue}
                              </OrderProtein>
                            )
                          );
                        })}
                        {/* <OrderProtein style={{ fontWeight: "bold" }}>
                          {protein}
                        </OrderProtein> */}

                        {(orderItem.extras || []).map((extra, extraIndex) => {
                          return (
                            <View
                              key={extraIndex}
                              style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "space-between",
                              }}
                            >
                              <OrderExtras>{extra.type}</OrderExtras>
                              <OrderExtras>
                                £{Number(extra.price || 0).toFixed(2)}
                              </OrderExtras>
                            </View>
                          );
                        })}
                      </ExtrasContainer>
                    ) : (
                      <NoExtrasContainer>
                         {proteins.map((protein, index) => {
                          const proteinValue = protein.protein
                            ? protein.protein.toUpperCase()
                            : null;
                          return (
                            proteinValue !== null && (
                              <OrderProtein
                                key={index}
                                style={{ fontWeight: "bold" }}
                              >
                                {proteinValue}
                              </OrderProtein>
                            )
                          );
                        })}
                      </NoExtrasContainer>
                    )}
                  </View>
                );
              })}
            </OrderContainer>
            <ProgressPanel>
              <ExpandedText>
                Status: <Text style={{ fontWeight: "normal" }}>{statusLabel(item)}</Text>
              </ExpandedText>
              <NextStepButton order={item} onSetStatus={onSetStatus} busy={busy} large />
              {undoTo && (
                <UndoButton
                  disabled={busy}
                  onPress={() => onSetStatus(item, undoTo)}
                  accessibilityRole="button"
                >
                  <UndoText>
                    Undo — back to {statusLabel({ ...item, status: undoTo })}
                  </UndoText>
                </UndoButton>
              )}
            </ProgressPanel>
          </ExpandedContent>
        )}
      </>
    );
  };

  return (
    <Container>
      {/* Header */}
      <Header>
        <HeaderText>Order</HeaderText>
        <HeaderText>Customer</HeaderText>
        <HeaderText>Type</HeaderText>
        <HeaderText>Total</HeaderText>
        <HeaderText>Status</HeaderText>
        <ActionHeader>Next step</ActionHeader>
      </Header>

      {/* Orders List */}
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        extraData={{ selectedId, updating }}
        ListEmptyComponent={<EmptyText>{emptyMessage}</EmptyText>}
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

const RowContainer = styled.View({
  flexDirection: "row",
  alignItems: "stretch",
});

const Row = styled.TouchableOpacity({
  flex: 5,
  flexDirection: "row",
});

const ActionCell = styled.View({
  width: 200,
  padding: 6,
  justifyContent: "center",
  border: "1px solid #D9D9D9",
});

const ActionHeader = styled.Text({
  fontWeight: "bold",
  width: 200,
  textAlign: "left",
});

const ActionButton = styled.TouchableOpacity((props) => ({
  backgroundColor: props.disabled ? "#7F8C9A" : "#2c3e50",
  borderRadius: 8,
  minHeight: props.$large ? 64 : 48,
  paddingHorizontal: 12,
  alignItems: "center",
  justifyContent: "center",
  marginVertical: props.$large ? 12 : 0,
}));

const ActionText = styled.Text((props) => ({
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: props.$large ? 20 : 15,
  textAlign: "center",
}));

const DoneText = styled.Text({
  textAlign: "center",
  color: "#3B8C3B",
  fontWeight: "bold",
});

const StatusCell = styled.View({
  flex: 1,
  justifyContent: "center",
  padding: "10px 6px",
  border: "1px solid #D9D9D9",
});

const StatusPill = styled.View({
  borderRadius: 12,
  paddingVertical: 4,
  paddingHorizontal: 8,
  alignSelf: "flex-start",
});

const StatusText = styled.Text({
  color: "#ffffff",
  fontSize: 13,
  fontWeight: "bold",
});

const UndoButton = styled.TouchableOpacity({
  minHeight: 44,
  justifyContent: "center",
});

const UndoText = styled.Text({
  color: "#2c3e50",
  textDecorationLine: "underline",
  fontSize: 14,
});

const EmptyText = styled.Text({
  textAlign: "center",
  color: "#7F8C9A",
  fontSize: 18,
  marginTop: 60,
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
const ProgressPanel = styled.View({
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
  paddingBottom: 10,
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
