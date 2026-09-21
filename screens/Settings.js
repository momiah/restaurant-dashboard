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

const Settings = () => {
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

      <SectionTitle>Ordering</SectionTitle>
      <Row label="Order types" value={(ordering.orderTypes || []).join(", ")} />
      <Row label="Delivery radius (miles)" value={String(ordering.deliveryRadiusMiles ?? "")} />
      <Row label="Postcodes" value={(ordering.allowedPostcodePrefixes || []).join(", ")} />
      <Row label="Free delivery over" value={ordering.freeDeliveryThreshold != null ? `${ordering.currency || ""} ${ordering.freeDeliveryThreshold}` : ""} />
      <Row label="Delivery fee" value={ordering.deliveryFee != null ? `${ordering.currency || ""} ${ordering.deliveryFee}` : ""} />
      <Row label="Currency" value={ordering.currency} />
      <Row label="Collection address" value={ordering.collectionAddress} />

      <SectionTitle>Payments</SectionTitle>
      <Row label="Provider" value={restaurant?.payments?.provider} />
      <Row label="Stripe account" value={restaurant?.payments?.stripeAccountId} />

      <Note>
        These values come from this restaurant's record in Firestore. A full in-app
        editor (identity, theme, menu) is the next dashboard milestone.
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
