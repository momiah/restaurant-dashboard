import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Switch } from "react-native";
import styled from "styled-components/native";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../config/firebase.config";
import { useAuth } from "../context/AuthContext";
import { fromRestaurant, isUnchanged, summary, toUpdate, validate } from "../helpers/deliverySettings";

// Lets the owner set their own delivery charges. Saves to their restaurant record
// (ordering.*), which the website, loyalty app and checkout read. The rules let an
// owner change these but never payments, billing, status or slug.
export default function DeliverySettings({ navigation }) {
  const { restaurant, restaurantId, reloadRestaurant } = useAuth();
  const initial = useMemo(() => fromRestaurant(restaurant), [restaurant]);
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  const set = (field) => (value) => setValues((v) => ({ ...v, [field]: value }));
  const errors = validate(values);
  const invalid = Object.keys(errors).length > 0;
  const unchanged = isUnchanged(values, initial);

  const save = async () => {
    if (invalid || unchanged || saving) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "restaurants", restaurantId), toUpdate(values));
      await reloadRestaurant?.();
      Alert.alert("Saved", "Your delivery settings are live on your website and app.");
      navigation?.goBack();
    } catch (e) {
      Alert.alert("Couldn't save", e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrap contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <Card>
        <ToggleRow>
          <ToggleText>
            <Title>Offer delivery</Title>
            <Help>Collection is always available.</Help>
          </ToggleText>
          <Switch
            value={values.delivery}
            onValueChange={set("delivery")}
            accessibilityLabel="Offer delivery"
          />
        </ToggleRow>
      </Card>

      <Card style={{ opacity: values.delivery ? 1 : 0.45 }}>
        <MoneyField
          label="Delivery fee"
          help="£0 means delivery is free."
          value={values.deliveryFee}
          onChange={set("deliveryFee")}
          error={errors.deliveryFee}
          editable={values.delivery}
        />
        <MoneyField
          label="Free delivery on orders over"
          help="0 means delivery is always free, so the fee is never charged."
          value={values.freeDeliveryThreshold}
          onChange={set("freeDeliveryThreshold")}
          error={errors.freeDeliveryThreshold}
          editable={values.delivery}
        />
      </Card>

      <Card>
        <MoneyField
          label="Minimum order (optional)"
          help="Applies to collection and delivery. Leave blank for no minimum."
          value={values.minOrder}
          onChange={set("minOrder")}
          error={errors.minOrder}
          placeholder="No minimum"
        />
      </Card>

      {summary(values) ? (
        <Summary>
          <SummaryLabel>What customers will see</SummaryLabel>
          <SummaryText testID="delivery-summary">{summary(values)}</SummaryText>
        </Summary>
      ) : null}

      <SaveBtn onPress={save} disabled={invalid || unchanged || saving} off={invalid || unchanged || saving} accessibilityRole="button">
        {saving ? <ActivityIndicator color="#fff" /> : <SaveTxt>{unchanged ? "No changes" : "Save delivery settings"}</SaveTxt>}
      </SaveBtn>
    </Wrap>
  );
}

function MoneyField({ label, help, value, onChange, error, editable = true, placeholder = "0.00" }) {
  return (
    <Field>
      <Label>{label}</Label>
      <InputRow>
        <Pound>£</Pound>
        <Input
          value={value}
          onChangeText={onChange}
          keyboardType="decimal-pad"
          placeholder={placeholder}
          editable={editable}
          accessibilityLabel={label}
          error={!!error}
        />
      </InputRow>
      {error ? <Error>{error}</Error> : <Help>{help}</Help>}
    </Field>
  );
}

const Wrap = styled.ScrollView({ flex: 1, backgroundColor: "#f4f6f8" });
const Card = styled.View({ backgroundColor: "#fff", borderRadius: 14, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#e6e9ec" });
const ToggleRow = styled.View({ flexDirection: "row", alignItems: "center", gap: 12 });
const ToggleText = styled.View({ flex: 1 });
const Title = styled.Text({ fontSize: 17, fontWeight: "800", color: "#17202A" });
const Field = styled.View({ marginBottom: 14 });
const Label = styled.Text({ fontSize: 15, fontWeight: "700", color: "#17202A", marginBottom: 6 });
const InputRow = styled.View({ flexDirection: "row", alignItems: "center", gap: 6 });
const Pound = styled.Text({ fontSize: 18, fontWeight: "700", color: "#5b6670" });
const Input = styled.TextInput(({ error }) => ({
  flex: 1,
  maxWidth: 220,
  borderWidth: 1,
  borderColor: error ? "#D64545" : "#d2d9df",
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 17,
  color: "#17202A",
  backgroundColor: "#fff",
}));
const Help = styled.Text({ fontSize: 13, color: "#6b7280", marginTop: 5 });
const Error = styled.Text({ fontSize: 13, color: "#D64545", fontWeight: "700", marginTop: 5 });
const Summary = styled.View({ backgroundColor: "#E9F5F4", borderRadius: 14, padding: 16, marginBottom: 16 });
const SummaryLabel = styled.Text({ fontSize: 12, fontWeight: "800", color: "#0A5F5E", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 });
const SummaryText = styled.Text({ fontSize: 15, color: "#123634" });
const SaveBtn = styled.TouchableOpacity(({ off }) => ({ backgroundColor: off ? "#c7ccd1" : "#2c3e50", borderRadius: 12, paddingVertical: 16, alignItems: "center", minHeight: 52, justifyContent: "center" }));
const SaveTxt = styled.Text({ color: "#fff", fontWeight: "800", fontSize: 16 });
