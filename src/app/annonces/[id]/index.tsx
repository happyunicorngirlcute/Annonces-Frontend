import { useCallback, useEffect, useState } from "react";
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
import Animated, {
  FadeInDown,
  FadeInLeft,
  FadeInRight,
} from "react-native-reanimated";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { Annonce, deleteAnnonce, fetchAnnonce } from "@/api";

function DetailRow({ label, value, accent }: { label: string; value: string; accent: string }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInLeft.duration(300).springify().damping(16)}
      style={[styles.detailRow, { borderColor: theme.accentDim }]}
    >
      <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
    </Animated.View>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
}

export default function DetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [annonce, setAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchAnnonce(id);
      setAnnonce(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteAnnonce(id);
      router.back();
    } catch {
      setDeleting(false);
    }
  }, [id]);

  const typeLabel = {
    appartement: "Appartement",
    maison: "Maison",
    terrain: "Terrain",
    local: "Local",
  }[annonce?.type ?? "appartement"];

  const topInset = Platform.OS === "web" ? Spacing.six : insets.top + Spacing.three;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: "transparent" }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (error || !annonce) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <View style={[styles.center, { backgroundColor: "transparent" }]}>
          <Text style={[styles.errorTitle, { color: theme.text }]}>Erreur</Text>
          <Text style={[styles.errorDesc, { color: theme.textSecondary }]}>{error || "Introuvable"}</Text>
          <Pressable onPress={load} style={[styles.retryBtn, { backgroundColor: theme.accent }]}>
            <Text style={styles.retryText}>Reessayer</Text>
          </Pressable>
        </View>
      </View>
    );
  }

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

        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: theme.text }]}>{annonce.titre}</Text>
          <Badge label={typeLabel} color={theme.accent} />
        </View>

        <Text style={[styles.price, { color: theme.accent }]}>
          {annonce.prix.toLocaleString("fr-FR")} €
        </Text>

        <View style={[styles.divider, { backgroundColor: theme.accentDim }]} />

        <DetailRow label="Ville" value={`${annonce.ville}${annonce.codePostal ? ` (${annonce.codePostal})` : ""}`} accent={theme.accent} />

        <View style={styles.detailGrid}>
          {annonce.surface != null && (
            <DetailRow label="Surface" value={`${annonce.surface} m²`} accent={theme.accent} />
          )}
          {annonce.pieces != null && (
            <DetailRow label="Pieces" value={`${annonce.pieces}`} accent={theme.accent} />
          )}
          {annonce.balcon != null && (
            <DetailRow label="Balcon" value={annonce.balcon ? "Oui" : "Non"} accent={theme.accent} />
          )}
          {annonce.jardin != null && (
            <DetailRow label="Jardin" value={annonce.jardin ? "Oui" : "Non"} accent={theme.accent} />
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
        <Text style={[styles.description, { color: theme.text }]}>{annonce.description}</Text>

        {annonce.photos && annonce.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
            {annonce.photos.map((url, i) => (
              <Animated.View
                key={i}
                entering={FadeInRight.delay(i * 80).duration(300)}
                style={[styles.photoPlaceholder, { backgroundColor: theme.accentDim }]}
              >
                <Text style={[styles.photoPlaceholderText, { color: theme.textMuted }]}>Photo {i + 1}</Text>
              </Animated.View>
            ))}
          </ScrollView>
        )}

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push({ pathname: "/annonces/[id]/modifier", params: { id } })}
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.actionBtnText}>Modifier</Text>
          </Pressable>

          <Pressable
            onPress={handleDelete}
            disabled={deleting}
            style={({ pressed }) => [
              styles.actionBtn,
              styles.deleteBtn,
              { borderColor: theme.accentDim, opacity: deleting ? 0.5 : pressed ? 0.85 : 1 },
            ]}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : (
              <Text style={[styles.deleteBtnText, { color: theme.accent }]}>Supprimer</Text>
            )}
          </Pressable>
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.015,
    lineHeight: 30,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.three,
  },
  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: Spacing.three,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 140,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.08,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: Spacing.three,
  },
  description: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 22,
  },
  photosRow: {
    marginTop: Spacing.three,
    gap: 8,
  },
  photoPlaceholder: {
    width: 120,
    height: 90,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  photoPlaceholderText: {
    fontSize: 11,
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: Spacing.five,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  deleteBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  errorDesc: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginTop: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
