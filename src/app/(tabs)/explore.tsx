import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AnimatedInput } from "@/components/animated-input";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/use-theme";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { fetchAnnonces } from "@/api";

type Annonce = {
  _id: string;
  titre: string;
  description: string;
  prix: number;
  type?: string;
  ville?: string;
  surface?: number;
  pieces?: number;
};

type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "empty" }
  | { type: "data"; items: Annonce[] };

function AnnonceCard({ item, index }: { item: Annonce; index: number }) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);

  const cardEnter = FadeInRight.delay(index * 60).duration(350).springify().damping(18);

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/annonces/[id]", params: { id: item._id } })}
    >
      <Animated.View
        entering={cardEnter}
        style={[
          styles.card,
          {
            backgroundColor: theme.surface,
            borderColor: theme.accentDim,
          },
          hovered && Platform.OS === "web" && { transform: [{ translateY: -3 }] },
        ]}
        {...(Platform.OS === "web" ? {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        } : {})}
      >
        <View style={[styles.cardAccent, { backgroundColor: theme.accent, width: 3 }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>{item.titre}</Text>
            {item.type && (
              <View style={[styles.cardType, { backgroundColor: theme.accentDim }]}>
                <Text style={[styles.cardTypeText, { color: theme.accent }]}>{item.type}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.cardFooter}>
            <View style={[styles.pricePill, { backgroundColor: theme.accent }]}>
              <Text style={styles.priceText}>
                {item.prix.toLocaleString("fr-FR")} €
              </Text>
            </View>
            {item.ville && (
              <Text style={[styles.cardVille, { color: theme.textMuted }]}>
                {item.ville}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function SkeletonLine({ width }: { width: string }) {
  const theme = useTheme();
  return <View style={[styles.skeletonLine, { width: width as any, backgroundColor: theme.backgroundSelected }]} />;
}

function SkeletonCard() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: "transparent" }]}>
      <View style={[styles.skeletonShimmer, { backgroundColor: theme.accentDim }]} />
      <View style={styles.cardBody}>
        <SkeletonLine width="60%" />
        <SkeletonLine width="100%" />
        <SkeletonLine width="35%" />
      </View>
    </View>
  );
}

export default function ExplorePage() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ type: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAnnonces();
      if (!data || data.length === 0) {
        setState({ type: "empty" });
      } else {
        setState({ type: "data", items: data });
      }
    } catch (err) {
      setState({
        type: "error",
        message: err instanceof Error ? err.message : "Erreur de connexion",
      });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const filtered = state.type === "data"
    ? searchQuery
      ? state.items.filter(
          (a) =>
            a.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.ville && a.ville.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : state.items
    : [];

  const topInset = Platform.OS === "web" ? Spacing.six : insets.top + Spacing.three;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView
        ref={scrollRef}
        style={[styles.screen, { backgroundColor: "transparent" }]}
        contentContainerStyle={{
          paddingTop: topInset,
          paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
        }}
        refreshControl={
          Platform.OS !== "web" ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          ) : undefined
        }
      >
        <Animated.View entering={FadeInDown.duration(500).springify().damping(22)} style={styles.content}>
          <Text style={[styles.title, { color: theme.text }]}>
            Toutes les annonces
          </Text>

          <AnimatedInput
            ref={inputRef}
            containerStyle={styles.searchBar}
            placeholder="Rechercher par mot-cle ou ville..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </Animated.View>

        <View style={[styles.divider, { backgroundColor: theme.accentDim }]} />

        <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.content}>
          {state.type === "loading" && !refreshing && (
            <View style={styles.list}>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </View>
          )}

          {state.type === "error" && (
            <View style={styles.centerState}>
              <Text style={[styles.stateTitle, { color: theme.text }]}>Erreur</Text>
              <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>{state.message}</Text>
              <Pressable
                onPress={load}
                style={({ pressed }) => [
                  styles.retryBtn,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.retryText}>Reessayer</Text>
              </Pressable>
            </View>
          )}

          {state.type === "empty" && (
            <View style={styles.centerState}>
              <Text style={[styles.stateTitle, { color: theme.text }]}>Aucune annonce</Text>
              <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>
                Aucune annonce pour le moment. Publiez la premiere.
              </Text>
              <Pressable
                onPress={() => router.push("/annonces/creer")}
                style={({ pressed }) => [
                  styles.retryBtn,
                  { backgroundColor: theme.accent, opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Text style={styles.retryText}>Publier une annonce</Text>
              </Pressable>
            </View>
          )}

          {state.type === "data" && (
            <>
              {refreshing && (
                <ActivityIndicator size="small" color={theme.accent} style={styles.refreshIndicator} />
              )}

              {searchQuery && filtered.length === 0 ? (
                <View style={styles.centerState}>
                  <Text style={[styles.stateTitle, { color: theme.text }]}>Aucun resultat</Text>
                  <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>
                    Essayez un autre terme de recherche
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.resultCount, { color: theme.textMuted }]}>
                    {filtered.length} annonce{filtered.length > 1 ? "s" : ""}
                    {searchQuery ? ` trouvée${filtered.length > 1 ? "s" : ""}` : ""}
                  </Text>
                  <View style={styles.list}>
                    {filtered.map((item, i) => (
                      <AnnonceCard key={item._id} item={item} index={i} />
                    ))}
                  </View>
                </>
              )}
            </>
          )}
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

  /* ─── Header ─── */
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.015,
    lineHeight: 30,
  },
  searchBar: {
    paddingHorizontal: 14,
    height: 44,
    marginTop: Spacing.three,
  },
  divider: {
    height: 1,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
    marginHorizontal: Spacing.four,
  },

  /* ─── Cards ─── */
  list: {
    gap: 12,
  },
  resultCount: {
    fontSize: 12,
    fontWeight: "400",
    marginBottom: Spacing.two,
  },
  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardAccent: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  cardBody: {
    flex: 1,
    padding: Spacing.three,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 20,
    flexShrink: 1,
  },
  cardType: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
    flexShrink: 0,
  },
  cardTypeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 10,
  },
  pricePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  priceText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cardVille: {
    fontSize: 12,
    fontWeight: "400",
  },

  /* ─── Skeletons ─── */
  skeletonShimmer: {
    width: 3,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginTop: 8,
  },

  /* ─── States ─── */
  centerState: {
    alignItems: "center",
    paddingVertical: Spacing.six,
    gap: 8,
  },
  stateTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  stateDesc: {
    fontSize: 14,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginTop: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  refreshIndicator: {
    marginBottom: 8,
  },
});
