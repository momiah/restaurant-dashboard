import React from "react";
import { ScrollView } from "react-native";
import styled from "styled-components/native";
import { useAuth } from "../context/AuthContext";

const Row = ({ label, value }) => (
  <FieldRow>
    <FieldLabel>{label}</FieldLabel>
    <FieldValue>{value || "—"}</FieldValue>
  </FieldRow>
);

const money = (n) => (n != null && n !== "" ? `£${Number(n).toFixed(2)}` : "");

const Settings = ({ navigation }) => {
  const { restaurant, user, signOutUser } = useAuth();
  const ordering = restaurant?.ordering || {};
  const contact = restaurant?.contact || {};
  const address = restaurant?.address || {};

  return (
    <Container contentContainerStyle={{ padding: 20 }}>
      <Heading>{restaurant?.name || "Restaurant"} settings</Heading>
      <SignedInAs>Signed in as {user?.email}</SignedInAs>

      <SectionTitle>Identity</SectionTitle>
      <Row label="Name" value={restaurant?.name} />
      <Row label="Slug" value={restaurant?.slug} />
      <Row label="Status" value={restaurant?.status} />
      <Row label="Phone" value={contact.phone} />
      <Row label="Email" value={contact.email} />
      <Row label="Instagram" value={contact.instagram} />
      <Row label="Address" value={address.formatted} />

      <SectionHead>
        <SectionTitle>Ordering</SectionTitle>
        <EditButton onPress={() => navigation?.navigate("DeliverySettings")} accessibilityRole="button">
          <EditText>Delivery settings</EditText>
        </EditButton>
      </SectionHead>
      <Row label="Order types" value={(ordering.orderTypes || []).join(", ")} />
      <Row label="Delivery fee" value={money(ordering.deliveryFee)} />
      <Row label="Free delivery over" value={money(ordering.freeDeliveryThreshold)} />
      <Row label="Minimum order" value={ordering.minOrder ? money(ordering.minOrder) : "None"} />
      <Row label="Delivery radius (miles)" value={String(ordering.deliveryRadiusMiles ?? "")} />
      <Row label="Postcodes" value={(ordering.allowedPostcodePrefixes || []).join(", ")} />
      <Row label="Currency" value={ordering.currency} />
      <Row label="Collection address" value={ordering.collectionAddress} />

      <SectionTitle>Payments</SectionTitle>
      <Row label="Provider" value={restaurant?.payments?.provider} />
      <Row label="Stripe account" value={restaurant?.payments?.stripeAccountId} />

      <Note>
        Change your delivery charges with Delivery settings, and your menu with the
        menu editor. For anything else here, contact MenuDock.
      </Note>

      <SignOutButton onPress={signOutUser}>
        <SignOutText>Sign out</SignOutText>
      </SignOutButton>
    </Container>
  );
};

const Container = styled.ScrollView({
  flex: 1,
  backgroundColor: "#ffffff",
});

const Heading = styled.Text({
  fontSize: 20,
  fontWeight: "bold",
});

const SignedInAs = styled.Text({
  fontSize: 13,
  color: "#6b6560",
  marginBottom: 16,
});

const SectionTitle = styled.Text({
  fontSize: 15,
  fontWeight: "bold",
  marginTop: 18,
  marginBottom: 6,
  color: "#2c3e50",
});

const SectionHead = styled.View({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 8,
});

const EditButton = styled.TouchableOpacity({
  backgroundColor: "#2c3e50",
  borderRadius: 8,
  paddingVertical: 10,
  paddingHorizontal: 16,
  minHeight: 44,
  justifyContent: "center",
});

const EditText = styled.Text({
  color: "#ffffff",
  fontWeight: "bold",
});

const FieldRow = styled.View({
  flexDirection: "row",
  justifyContent: "space-between",
  paddingVertical: 8,
  borderBottomWidth: 1,
  borderBottomColor: "#eeeeee",
});

const FieldLabel = styled.Text({
  color: "#6b6560",
  flex: 1,
});

const FieldValue = styled.Text({
  fontWeight: "500",
  flex: 1,
  textAlign: "right",
});

const Note = styled.Text({
  marginTop: 18,
  color: "#6b6560",
  fontSize: 13,
  fontStyle: "italic",
});

const SignOutButton = styled.TouchableOpacity({
  marginTop: 24,
  backgroundColor: "#c0392b",
  borderRadius: 8,
  padding: 14,
  alignItems: "center",
});

const SignOutText = styled.Text({
  color: "#ffffff",
  fontWeight: "bold",
});

export default Settings;
