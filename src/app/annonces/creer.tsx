import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedInput } from "@/components/animated-input";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { AnnonceForm, createAnnonce } from "@/api";

const { width: WINDOW_W } = Dimensions.get("window");
const TYPES = ["appartement", "maison", "terrain", "local"] as const;

export default function CreatePage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<AnnonceForm>({
    titre: "",
    description: "",
    prix: "",
    surface: "",
    pieces: "",
    type: "",
    ville: "",
    codePostal: "",
    balcon: false,
    jardin: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = useCallback(<K extends keyof AnnonceForm>(key: K, value: AnnonceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.titre || !form.description || !form.prix || !form.type || !form.ville) {
      setError("Tous les champs obligatoires doivent etre remplis");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const data: Record<string, unknown> = {
        titre: form.titre,
        description: form.description,
        prix: parseFloat(form.prix),
        type: form.type,
        ville: form.ville,
        balcon: form.balcon,
        jardin: form.jardin,
      };
      if (form.surface) data.surface = parseFloat(form.surface);
      if (form.pieces) data.pieces = parseInt(form.pieces, 10);
      if (form.codePostal) data.codePostal = form.codePostal;
      await createAnnonce(data);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la creation");
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  const topInset = Platform.OS === "web" ? Spacing.six : insets.top + Spacing.three;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        style={[styles.screen, { backgroundColor: "transparent" }]}
        contentContainerStyle={{
          paddingTop: topInset,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
        }}
      >
      <Animated.View entering={FadeInDown.duration(500).springify().damping(20)} style={styles.content}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { borderColor: theme.accentDim }]}>
          <Text style={[styles.backText, { color: theme.accent }]}>Retour</Text>
        </Pressable>

        <Text style={[styles.title, { color: theme.text }]}>Nouvelle annonce</Text>

        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Titre *</Text>
          <AnimatedInput
            value={form.titre}
            onChangeText={(v) => updateField("titre", v)}
            placeholder="Ex: Bel appartement lumineux"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Description *</Text>
          <AnimatedInput
            value={form.description}
            onChangeText={(v) => updateField("description", v)}
            placeholder="Decrivez votre annonce..."
            multiline
            numberOfLines={4}
            containerStyle={styles.textArea}
          />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Prix (EUR) *</Text>
              <AnimatedInput
                value={form.prix}
                onChangeText={(v) => updateField("prix", v)}
                keyboardType="numeric"
                placeholder="150000"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Type *</Text>
              <View style={styles.typeRow}>
                {TYPES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => updateField("type", t)}
                    style={[
                      styles.typeBtn,
                      {
                        backgroundColor: form.type === t ? theme.accent : theme.backgroundElement,
                        borderColor: form.type === t ? theme.accent : theme.accentDim,
                      },
                    ]}
                  >
                    <Text style={[styles.typeBtnText, { color: form.type === t ? "#fff" : theme.text }]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Surface (m²)</Text>
              <AnimatedInput
                value={form.surface}
                onChangeText={(v) => updateField("surface", v)}
                keyboardType="numeric"
                placeholder="75"
              />
            </View>
            <View style={styles.halfField}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Pieces</Text>
              <AnimatedInput
                value={form.pieces}
                onChangeText={(v) => updateField("pieces", v)}
                keyboardType="numeric"
                placeholder="3"
              />
            </View>
          </View>

          <Text style={[styles.label, { color: theme.textSecondary }]}>Ville *</Text>
          <AnimatedInput
            value={form.ville}
            onChangeText={(v) => updateField("ville", v)}
            placeholder="Ex: Paris"
          />

          <Text style={[styles.label, { color: theme.textSecondary }]}>Code postal</Text>
          <AnimatedInput
            value={form.codePostal}
            onChangeText={(v) => updateField("codePostal", v)}
            keyboardType="numeric"
            placeholder="75001"
          />

          <View style={styles.checkRow}>
            <Pressable
              onPress={() => updateField("balcon", !form.balcon)}
              style={[
                styles.checkbox,
                { backgroundColor: form.balcon ? theme.accent : theme.backgroundElement, borderColor: form.balcon ? theme.accent : theme.accentDim },
              ]}
            >
              {form.balcon && <Text style={styles.checkmark}>+</Text>}
            </Pressable>
            <Text style={[styles.checkLabel, { color: theme.text }]}>Balcon</Text>

            <View style={{ width: 20 }} />

            <Pressable
              onPress={() => updateField("jardin", !form.jardin)}
              style={[
                styles.checkbox,
                { backgroundColor: form.jardin ? theme.accent : theme.backgroundElement, borderColor: form.jardin ? theme.accent : theme.accentDim },
              ]}
            >
              {form.jardin && <Text style={styles.checkmark}>+</Text>}
            </Pressable>
            <Text style={[styles.checkLabel, { color: theme.text }]}>Jardin</Text>
          </View>

          {error ? (
            <Text style={[styles.errorText, { color: theme.accent }]}>{error}</Text>
          ) : null}

          <Animated.View entering={FadeInUp.duration(300).springify().damping(12)}>
            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: theme.accent, opacity: submitting ? 0.5 : pressed ? 0.85 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Publier l'annonce</Text>
              )}
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.four,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    marginBottom: Spacing.three,
  },
  backText: {
    fontSize: 13,
    fontWeight: "600",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.015,
    marginBottom: Spacing.four,
  },
  form: {
    gap: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.03,
  },
  textArea: {
    minHeight: 88,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
    gap: 6,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  typeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  checkLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  errorText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  submitBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.two,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
