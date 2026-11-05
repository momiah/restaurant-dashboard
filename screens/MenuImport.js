import React, { useState } from "react";
import { Alert, ActivityIndicator } from "react-native";
import styled from "styled-components/native";
import { useAuth } from "../context/AuthContext";
import { importErrorMessage, importMenuFile, pickMenuFile } from "../helpers/menuImport";
import { loadMenu, mergeMenus, saveMenu } from "../helpers/menuStore";

// Turn a photo or file of the restaurant's menu into a digital menu:
//   1. choose  — take a photo or pick a PDF / Word / Excel / CSV file
//   2. reading — upload it and let the importMenu function read it
//   3. preview — the owner checks and edits what was found
//   4. save    — add it to the current menu, or replace the menu with it
// Nothing reaches the live menu until step 4.
export default function MenuImport({ navigation }) {
  const { restaurantId } = useAuth();
  const [step, setStep] = useState("choose"); // choose | reading | preview | saving
  const [fileName, setFileName] = useState("");
  const [draft, setDraft] = useState([]); // [{ category, items: [{ name, description, price }] }]
  const [warnings, setWarnings] = useState([]);

  const start = async (source) => {
    let file;
    try {
      file = await pickMenuFile(source);
    } catch (e) {
      Alert.alert("Couldn't use that file", e.message);
      return;
    }
    if (!file) return;
    setFileName(file.name);
    setStep("reading");
    try {
      const result = await importMenuFile(restaurantId, file);
      // Prices are edited as text in the preview.
      setDraft(
        result.categories.map((c) => ({
          category: c.category,
          items: c.items.map((i) => ({ ...i, price: i.price == null ? "" : String(i.price) })),
        }))
      );
      setWarnings(result.warnings);
      setStep("preview");
    } catch (e) {
      Alert.alert("Couldn't read that menu", importErrorMessage(e));
      setStep("choose");
    }
  };

  const updateCategory = (ci, category) =>
    setDraft((d) => d.map((c, i) => (i === ci ? { ...c, category } : c)));
  const updateItem = (ci, ii, patch) =>
    setDraft((d) => d.map((c, i) => (i === ci ? { ...c, items: c.items.map((it, j) => (j === ii ? { ...it, ...patch } : it)) } : c)));
  const removeItem = (ci, ii) =>
    setDraft((d) =>
      d.map((c, i) => (i === ci ? { ...c, items: c.items.filter((_, j) => j !== ii) } : c)).filter((c) => c.items.length > 0)
    );

  const itemCount = draft.reduce((n, c) => n + c.items.length, 0);
  const missingPrices = draft.reduce(
    (n, c) => n + c.items.filter((i) => !(Number(i.price) > 0) && String(i.price).trim() !== "0").length,
    0
  );
  const unnamed = draft.reduce((n, c) => n + c.items.filter((i) => !i.name.trim()).length, 0);
  const blocker =
    itemCount === 0
      ? "There's nothing left to import."
      : unnamed > 0
      ? `${unnamed} item${unnamed === 1 ? " has" : "s have"} no name.`
      : missingPrices > 0
      ? `${missingPrices} item${missingPrices === 1 ? " has" : "s have"} no price — add one, or remove the item.`
      : null;

  const save = async (mode) => {
    setStep("saving");
    try {
      const existing = await loadMenu(restaurantId);
      const cleaned = draft.map((c) => ({
        category: c.category.trim() || "Menu",
        items: c.items.map((i) => ({ ...i, price: Number(i.price) || 0 })),
      }));
      const { categories, deleted } = mergeMenus(existing, cleaned, mode);
      await saveMenu(restaurantId, categories, deleted);
      Alert.alert("Menu saved", "Your menu is live on the website and loyalty app. Add photos from the menu editor.");
      navigation?.goBack();
    } catch (e) {
      Alert.alert("Couldn't save", e.message);
      setStep("preview");
    }
  };

  const confirmReplace = () =>
    Alert.alert(
      "Replace your whole menu?",
      "Everything currently on your menu will be removed and replaced with these items.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Replace", style: "destructive", onPress: () => save("replace") },
      ]
    );

  if (step === "choose") {
    return (
      <Wrap>
        <Centered>
          <Title>Import a menu</Title>
          <Sub>We'll read your menu and show you every item to check before anything goes live.</Sub>
          <Choices>
            <Choice onPress={() => start("camera")} accessibilityRole="button">
              <ChoiceIcon>📷</ChoiceIcon>
              <ChoiceTitle>Take a photo</ChoiceTitle>
              <ChoiceSub>Of a printed menu. Lay it flat in good light.</ChoiceSub>
            </Choice>
            <Choice onPress={() => start("file")} accessibilityRole="button">
              <ChoiceIcon>📄</ChoiceIcon>
              <ChoiceTitle>Upload a file</ChoiceTitle>
              <ChoiceSub>PDF, Word (.docx), Excel (.xlsx), CSV or a photo.</ChoiceSub>
            </Choice>
          </Choices>
        </Centered>
      </Wrap>
    );
  }

  if (step === "reading") {
    return (
      <Wrap>
        <Centered>
          <ActivityIndicator size="large" />
          <Title style={{ marginTop: 16 }}>Reading your menu…</Title>
          <Sub>This can take up to a minute for a long menu.</Sub>
        </Centered>
      </Wrap>
    );
  }

  return (
    <Wrap>
      <Body contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Title>Check your menu</Title>
        <Sub>
          Found {itemCount} item{itemCount === 1 ? "" : "s"} in {draft.length} categor{draft.length === 1 ? "y" : "ies"}
          {fileName ? ` from ${fileName}` : ""}. Fix anything that's wrong, then save.
        </Sub>

        {warnings.length > 0 && (
          <WarningBox>
            <WarningTitle>Please double-check</WarningTitle>
            {warnings.map((w, i) => (
              <WarningText key={i}>• {w}</WarningText>
            ))}
          </WarningBox>
        )}

        {draft.map((cat, ci) => (
          <Card key={ci}>
            <CatInput value={cat.category} onChangeText={(t) => updateCategory(ci, t)} placeholder="Category name" accessibilityLabel="Category name" />
            {cat.items.map((item, ii) => {
              const noPrice = !(Number(item.price) > 0) && String(item.price).trim() !== "0";
              return (
                <ItemRow key={ii}>
                  <ItemFields>
                    <Row>
                      <NameInput value={item.name} onChangeText={(t) => updateItem(ci, ii, { name: t })} placeholder="Item name" accessibilityLabel="Item name" />
                      <PriceInput
                        value={item.price}
                        onChangeText={(t) => updateItem(ci, ii, { price: t })}
                        placeholder="Price"
                        keyboardType="decimal-pad"
                        $missing={noPrice}
                        accessibilityLabel={`Price of ${item.name}`}
                      />
                    </Row>
                    <DescInput value={item.description} onChangeText={(t) => updateItem(ci, ii, { description: t })} placeholder="Description (optional)" multiline accessibilityLabel={`Description of ${item.name}`} />
                  </ItemFields>
                  <IconBtn onPress={() => removeItem(ci, ii)} accessibilityLabel={`Remove ${item.name}`}>
                    <IconTxt>🗑</IconTxt>
                  </IconBtn>
                </ItemRow>
              );
            })}
          </Card>
        ))}
      </Body>

      <SaveBar>
        {blocker ? <Blocker>{blocker}</Blocker> : null}
        <Row>
          <Ghost onPress={() => setStep("choose")} disabled={step === "saving"}>
            <GhostTxt>Start again</GhostTxt>
          </Ghost>
          <Secondary onPress={() => save("add")} disabled={!!blocker || step === "saving"} $off={!!blocker}>
            <SecondaryTxt>Add to my menu</SecondaryTxt>
          </Secondary>
          <Primary onPress={confirmReplace} disabled={!!blocker || step === "saving"} $off={!!blocker}>
            {step === "saving" ? <ActivityIndicator color="#fff" /> : <PrimaryTxt>Replace my menu</PrimaryTxt>}
          </Primary>
        </Row>
      </SaveBar>
    </Wrap>
  );
}

const Wrap = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.background }));
const Centered = styled.View({ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 });
const Body = styled.ScrollView({ flex: 1 });
const Title = styled.Text({ fontSize: 22, fontWeight: "800", color: "#17202A", textAlign: "center" });
const Sub = styled.Text({ fontSize: 14, color: "#6b7280", marginTop: 6, marginBottom: 16, textAlign: "center" });
const Choices = styled.View({ flexDirection: "row", gap: 16, marginTop: 8 });
const Choice = styled.TouchableOpacity(({ theme }) => ({ width: 260, padding: 20, borderRadius: 16, backgroundColor: "#fff", borderWidth: 1.5, borderColor: theme.colors.primary, alignItems: "center" }));
const ChoiceIcon = styled.Text({ fontSize: 40 });
const ChoiceTitle = styled.Text(({ theme }) => ({ fontSize: 17, fontWeight: "800", color: theme.colors.primary, marginTop: 8 }));
const ChoiceSub = styled.Text({ fontSize: 13, color: "#6b7280", textAlign: "center", marginTop: 4 });
const WarningBox = styled.View({ backgroundColor: "#FFF7E0", borderColor: "#F0C04A", borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 });
const WarningTitle = styled.Text({ fontWeight: "800", color: "#7A5300", marginBottom: 4 });
const WarningText = styled.Text({ color: "#7A5300", fontSize: 13, marginTop: 2 });
const Card = styled.View({ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#eee" });
const CatInput = styled.TextInput(({ theme }) => ({ fontSize: 18, fontWeight: "800", color: theme.colors.text, paddingVertical: 6, marginBottom: 4 }));
const ItemRow = styled.View({ flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#f1f1f1" });
const ItemFields = styled.View({ flex: 1, gap: 6 });
const Row = styled.View({ flexDirection: "row", gap: 10 });
const inputBase = { borderWidth: 1, borderColor: "#dce0e4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15, color: "#17202A" };
const NameInput = styled.TextInput({ ...inputBase, flex: 1, fontWeight: "600" });
const PriceInput = styled.TextInput((props) => ({ ...inputBase, width: 110, borderColor: props.$missing ? "#D64545" : "#dce0e4", backgroundColor: props.$missing ? "#FDECEC" : "#fff" }));
const DescInput = styled.TextInput({ ...inputBase, fontSize: 13 });
const IconBtn = styled.TouchableOpacity({ padding: 10 });
const IconTxt = styled.Text({ fontSize: 18 });
const SaveBar = styled.View({ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: "rgba(255,255,255,0.97)", borderTopWidth: 1, borderTopColor: "#eee" });
const Blocker = styled.Text({ color: "#D64545", fontWeight: "700", marginBottom: 8, textAlign: "center" });
const Ghost = styled.TouchableOpacity({ flex: 1, paddingVertical: 15, alignItems: "center", borderRadius: 12, backgroundColor: "#f0f2f4" });
const GhostTxt = styled.Text({ fontWeight: "700", color: "#17202A" });
const Secondary = styled.TouchableOpacity(({ theme, $off }) => ({ flex: 1, paddingVertical: 15, alignItems: "center", borderRadius: 12, borderWidth: 2, borderColor: $off ? "#c7ccd1" : theme.colors.primary, backgroundColor: "#fff" }));
const SecondaryTxt = styled.Text(({ theme }) => ({ fontWeight: "800", color: theme.colors.primary }));
const Primary = styled.TouchableOpacity(({ theme, $off }) => ({ flex: 1, paddingVertical: 15, alignItems: "center", borderRadius: 12, backgroundColor: $off ? "#c7ccd1" : theme.colors.primary }));
const PrimaryTxt = styled.Text({ fontWeight: "800", color: "#fff" });
