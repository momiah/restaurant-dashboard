import React, { useEffect, useState } from "react";
import { ScrollView, Modal, Alert, ActivityIndicator } from "react-native";
import styled from "styled-components/native";
import { collection, doc, getDocs, orderBy, query, writeBatch } from "firebase/firestore";
import { db } from "../config/firebase.config";
import { useAuth } from "../context/AuthContext";
import { addMenuPhoto } from "../helpers/menuPhotos";

const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Owners edit their menu here; it writes to restaurants/{id}/menu — the same data the
// customer website and loyalty app read, so changes appear everywhere instantly.
export default function MenuEditor() {
  const { restaurantId } = useAuth();
  const [categories, setCategories] = useState([]);
  const [deleted, setDeleted] = useState([]); // doc ids of removed categories
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editing, setEditing] = useState(null); // { c, i, draft }
  const [photoBusy, setPhotoBusy] = useState(false);

  useEffect(() => {
    if (!restaurantId) return;
    (async () => {
      try {
        let snap;
        const ref = collection(db, "restaurants", restaurantId, "menu");
        try {
          snap = await getDocs(query(ref, orderBy("order")));
        } catch {
          snap = await getDocs(ref);
        }
        setCategories(
          snap.docs.map((d) => {
            const data = d.data();
            return { id: d.id, category: data.category || d.id, items: data.items || [] };
          })
        );
      } catch (e) {
        Alert.alert("Couldn't load menu", e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [restaurantId]);

  const touch = () => setDirty(true);
  const updateCat = (ci, patch) => {
    setCategories((prev) => prev.map((c, i) => (i === ci ? { ...c, ...patch } : c)));
    touch();
  };
  const addCategory = () => {
    setCategories((prev) => [...prev, { id: null, category: "New category", items: [] }]);
    touch();
  };
  const removeCategory = (ci) => {
    Alert.alert("Delete category?", `"${categories[ci].category}" and its items will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const cat = categories[ci];
          if (cat.id) setDeleted((d) => [...d, cat.id]);
          setCategories((prev) => prev.filter((_, i) => i !== ci));
          touch();
        },
      },
    ]);
  };

  const openItem = (c, i) => {
    const base = i == null ? { name: "", price: "", description: "", imageUrl: "" } : categories[c].items[i];
    setEditing({ c, i, draft: { ...base, price: String(base.price ?? "") } });
  };
  const saveItem = () => {
    const { c, i, draft } = editing;
    const item = { ...(i == null ? { extras: [], protein: [] } : categories[c].items[i]), name: draft.name.trim(), price: Number(draft.price) || 0, description: (draft.description || "").trim() };
    // Firestore rejects undefined, so drop the field rather than blanking it.
    if (draft.imageUrl) item.imageUrl = draft.imageUrl;
    else delete item.imageUrl;
    setCategories((prev) =>
      prev.map((cat, ci) => {
        if (ci !== c) return cat;
        const items = [...cat.items];
        if (i == null) items.push(item);
        else items[i] = item;
        return { ...cat, items };
      })
    );
    setEditing(null);
    touch();
  };
  // Uploads straight away (so the sheet can show it); the item only points at the new
  // photo once the owner taps Done and then saves the menu.
  const choosePhoto = async (source) => {
    setPhotoBusy(true);
    try {
      const url = await addMenuPhoto({ restaurantId, itemName: editing?.draft.name, source });
      if (url) setEditing((e) => (e ? { ...e, draft: { ...e.draft, imageUrl: url } } : e));
    } catch (e) {
      Alert.alert("Couldn't add photo", e.message);
    } finally {
      setPhotoBusy(false);
    }
  };
  const removePhoto = () => setEditing((e) => ({ ...e, draft: { ...e.draft, imageUrl: "" } }));

  const removeItem = (c, i) => {
    setCategories((prev) => prev.map((cat, ci) => (ci === c ? { ...cat, items: cat.items.filter((_, j) => j !== i) } : cat)));
    touch();
  };

  const save = async () => {
    setSaving(true);
    try {
      const batch = writeBatch(db);
      categories.forEach((cat, idx) => {
        const id = cat.id || slugify(cat.category) || `category-${idx + 1}`;
        batch.set(doc(db, "restaurants", restaurantId, "menu", id), {
          category: cat.category.trim() || "Menu",
          order: idx + 1,
          items: cat.items,
        });
      });
      deleted.forEach((id) => batch.delete(doc(db, "restaurants", restaurantId, "menu", id)));
      await batch.commit();
      setDeleted([]);
      setDirty(false);
      Alert.alert("Saved", "Your menu is live on the website and loyalty app.");
    } catch (e) {
      Alert.alert("Couldn't save", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Center><ActivityIndicator size="large" /></Center>;

  return (
    <Wrap>
      <Body contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {categories.length === 0 && <Empty>No menu yet. Add your first category below.</Empty>}

        {categories.map((cat, ci) => (
          <Card key={cat.id || `new-${ci}`}>
            <CatHead>
              <CatInput value={cat.category} onChangeText={(t) => updateCat(ci, { category: t })} placeholder="Category name" />
              <IconBtn onPress={() => removeCategory(ci)}><IconTxt>✕</IconTxt></IconBtn>
            </CatHead>

            {cat.items.map((it, ii) => (
              <Item key={ii} onPress={() => openItem(ci, ii)}>
                {it.imageUrl ? <Thumb source={{ uri: it.imageUrl }} accessibilityLabel={`Photo of ${it.name}`} /> : <ThumbEmpty><ThumbEmptyTxt>No photo</ThumbEmptyTxt></ThumbEmpty>}
                <ItemMain>
                  <ItemName>{it.name || "(unnamed)"}</ItemName>
                  {it.description ? <ItemDesc numberOfLines={1}>{it.description}</ItemDesc> : null}
                </ItemMain>
                <ItemPrice>£{Number(it.price || 0).toFixed(2)}</ItemPrice>
                <IconBtn onPress={() => removeItem(ci, ii)}><IconTxt>🗑</IconTxt></IconBtn>
              </Item>
            ))}

            <AddItem onPress={() => openItem(ci, null)}><AddItemTxt>+ Add item</AddItemTxt></AddItem>
          </Card>
        ))}

        <AddCat onPress={addCategory}><AddCatTxt>+ Add category</AddCatTxt></AddCat>
      </Body>

      <SaveBar>
        <SaveBtn onPress={save} disabled={!dirty || saving} active={dirty && !saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <SaveTxt>{dirty ? "Save changes" : "All changes saved"}</SaveTxt>}
        </SaveBtn>
      </SaveBar>

      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <ModalScrim>
          <Sheet>
            <SheetTitle>{editing?.i == null ? "New item" : "Edit item"}</SheetTitle>
            <Label>Name</Label>
            <Input value={editing?.draft.name} onChangeText={(t) => setEditing((e) => ({ ...e, draft: { ...e.draft, name: t } }))} placeholder="e.g. Soft Taco" />
            <Label>Price (£)</Label>
            <Input value={editing?.draft.price} onChangeText={(t) => setEditing((e) => ({ ...e, draft: { ...e.draft, price: t } }))} placeholder="2.15" keyboardType="decimal-pad" />
            <Label>Description</Label>
            <Input value={editing?.draft.description} onChangeText={(t) => setEditing((e) => ({ ...e, draft: { ...e.draft, description: t } }))} placeholder="Short description" multiline />
            <Label>Photo</Label>
            <PhotoRow>
              {photoBusy ? (
                <PhotoPreviewEmpty><ActivityIndicator /></PhotoPreviewEmpty>
              ) : editing?.draft.imageUrl ? (
                <PhotoPreview source={{ uri: editing.draft.imageUrl }} accessibilityLabel="Item photo" />
              ) : (
                <PhotoPreviewEmpty><ThumbEmptyTxt>No photo</ThumbEmptyTxt></PhotoPreviewEmpty>
              )}
              <PhotoActions>
                <PhotoBtn onPress={() => choosePhoto("camera")} disabled={photoBusy}><PhotoBtnTxt>Take photo</PhotoBtnTxt></PhotoBtn>
                <PhotoBtn onPress={() => choosePhoto("library")} disabled={photoBusy}><PhotoBtnTxt>Choose photo</PhotoBtnTxt></PhotoBtn>
                {editing?.draft.imageUrl && !photoBusy ? (
                  <PhotoBtn onPress={removePhoto}><RemoveTxt>Remove photo</RemoveTxt></PhotoBtn>
                ) : null}
              </PhotoActions>
            </PhotoRow>
            <Row>
              <Ghost onPress={() => setEditing(null)}><GhostTxt>Cancel</GhostTxt></Ghost>
              <Primary onPress={saveItem} disabled={photoBusy} style={{ opacity: photoBusy ? 0.5 : 1 }}><PrimaryTxt>Done</PrimaryTxt></Primary>
            </Row>
          </Sheet>
        </ModalScrim>
      </Modal>
    </Wrap>
  );
}

const Wrap = styled.View(({ theme }) => ({ flex: 1, backgroundColor: theme.colors.background }));
const Center = styled.View({ flex: 1, alignItems: "center", justifyContent: "center" });
const Body = styled.ScrollView({ flex: 1 });
const Empty = styled.Text({ color: "#6b7280", textAlign: "center", marginTop: 40 });
const Card = styled.View({ backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: "#eee" });
const CatHead = styled.View({ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 });
const CatInput = styled.TextInput(({ theme }) => ({ flex: 1, fontSize: 18, fontWeight: "800", color: theme.colors.text, paddingVertical: 6 }));
const Item = styled.TouchableOpacity({ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: "#f1f1f1" });
const ItemMain = styled.View({ flex: 1 });
const Thumb = styled.Image({ width: 48, height: 36, borderRadius: 6, backgroundColor: "#f0f2f4" });
const ThumbEmpty = styled.View({ width: 48, height: 36, borderRadius: 6, backgroundColor: "#f0f2f4", alignItems: "center", justifyContent: "center" });
const ThumbEmptyTxt = styled.Text({ fontSize: 9, color: "#9aa0a6" });
const PhotoRow = styled.View({ flexDirection: "row", gap: 14, alignItems: "center" });
const PhotoPreview = styled.Image({ width: 160, height: 120, borderRadius: 10, backgroundColor: "#f0f2f4" });
const PhotoPreviewEmpty = styled.View({ width: 160, height: 120, borderRadius: 10, backgroundColor: "#f0f2f4", alignItems: "center", justifyContent: "center" });
const PhotoActions = styled.View({ gap: 8 });
const PhotoBtn = styled.TouchableOpacity({ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#f0f2f4", minHeight: 44, justifyContent: "center" });
const PhotoBtnTxt = styled.Text({ fontWeight: "700", color: "#17202A" });
const RemoveTxt = styled.Text({ fontWeight: "700", color: "#c0392b" });
const ItemName = styled.Text({ fontSize: 15, fontWeight: "600", color: "#17202A" });
const ItemDesc = styled.Text({ fontSize: 12, color: "#9aa0a6" });
const ItemPrice = styled.Text({ fontSize: 15, fontWeight: "700", color: "#17202A" });
const IconBtn = styled.TouchableOpacity({ padding: 6 });
const IconTxt = styled.Text({ fontSize: 16 });
const AddItem = styled.TouchableOpacity(({ theme }) => ({ marginTop: 10, alignSelf: "flex-start" }));
const AddItemTxt = styled.Text(({ theme }) => ({ color: theme.colors.primary, fontWeight: "700" }));
const AddCat = styled.TouchableOpacity(({ theme }) => ({ borderWidth: 1.5, borderColor: theme.colors.primary, borderStyle: "dashed", borderRadius: 12, paddingVertical: 14, alignItems: "center" }));
const AddCatTxt = styled.Text(({ theme }) => ({ color: theme.colors.primary, fontWeight: "800" }));
const SaveBar = styled.View({ position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, backgroundColor: "rgba(255,255,255,0.96)", borderTopWidth: 1, borderTopColor: "#eee" });
const SaveBtn = styled.TouchableOpacity(({ theme, active }) => ({ backgroundColor: active ? theme.colors.primary : "#c7ccd1", borderRadius: 12, paddingVertical: 15, alignItems: "center" }));
const SaveTxt = styled.Text({ color: "#fff", fontWeight: "800", fontSize: 16 });

const ModalScrim = styled.View({ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" });
const Sheet = styled.View({ backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 });
const SheetTitle = styled.Text({ fontSize: 18, fontWeight: "800", marginBottom: 12 });
const Label = styled.Text({ fontSize: 13, fontWeight: "600", color: "#6b7280", marginTop: 10, marginBottom: 4 });
const Input = styled.TextInput({ borderWidth: 1, borderColor: "#dce0e4", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15, color: "#17202A" });
const Row = styled.View({ flexDirection: "row", gap: 10, marginTop: 18 });
const Ghost = styled.TouchableOpacity({ flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: "#f0f2f4" });
const GhostTxt = styled.Text({ fontWeight: "700", color: "#17202A" });
const Primary = styled.TouchableOpacity(({ theme }) => ({ flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: 12, backgroundColor: theme.colors.primary }));
const PrimaryTxt = styled.Text({ fontWeight: "800", color: "#fff" });
