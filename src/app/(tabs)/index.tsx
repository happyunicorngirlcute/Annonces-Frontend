import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/hooks/use-theme";
import { BottomTabInset, Spacing } from "@/constants/theme";

type Annonce = {
  _id: string;
  titre: string;
  description: string;
  prix: number;
};

type State =
  | { type: "loading" }
  | { type: "error"; message: string }
  | { type: "empty" }
  | { type: "data"; items: Annonce[] };

const API_URL = "http://localhost:3000/api";
const SEARCH_PROMPTS = [
  "Un appartement ? Une voiture ?",
  "Le bon plan de votre quartier",
  "Ca commence par une recherche",
];
const { width: WINDOW_W } = Dimensions.get("window");

function useCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const start = performance.now();
    const raf = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const easeOutBack = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const overshoot = progress >= 1
        ? 1 - (1 - easeOutBack) * 0.3
        : easeOutBack;
      setCount(Math.floor(overshoot * target));
      if (progress < 1) requestAnimationFrame(raf);
      else setCount(target);
    };
    requestAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

function AmbientOrb({
  size,
  x,
  y,
  durationX,
  durationY,
  color,
}: {
  size: number;
  x: number;
  y: number;
  durationX: number;
  durationY: number;
  color: string;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(30, { duration: durationX }),
        withTiming(-20, { duration: durationX }),
        withTiming(10, { duration: durationX }),
        withTiming(0, { duration: durationX })
      ),
      -1, true
    );
    translateY.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: durationY }),
        withTiming(15, { duration: durationY }),
        withTiming(0, { duration: durationY })
      ),
      -1, true
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000 }),
        withTiming(0.85, { duration: 3000 })
      ),
      -1, true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: x,
          top: y,
          opacity: 0.12,
        },
        style,
      ]}
    />
  );
}

function PulseDot() {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1, true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View pointerEvents="none" style={[styles.pulseDot, style]} />;
}

function SkeletonCard() {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: "transparent" }]}>
      <View style={[styles.skeletonShimmer, { backgroundColor: theme.accentDim }]} />
      <View style={styles.cardBody}>
        <View style={[styles.skeletonLine, { width: "70%", backgroundColor: theme.backgroundSelected }]} />
        <View style={[styles.skeletonLine, { width: "100%", marginTop: 8, backgroundColor: theme.backgroundSelected, opacity: 0.6 }]} />
        <View style={[styles.skeletonLine, { width: "40%", marginTop: 8, backgroundColor: theme.backgroundSelected, opacity: 0.4 }]} />
        <View style={[styles.skeletonBadge, { backgroundColor: theme.accentDim }]} />
      </View>
    </View>
  );
}

function TiltCard({ children, style: outerStyle }: { children: React.ReactNode; style?: any }) {
  const theme = useTheme();
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const glareX = useSharedValue(50);
  const glareY = useSharedValue(50);

  const tiltStyle = useAnimatedStyle(() => ({
    transform: Platform.OS === "web"
      ? [
          { perspective: 800 },
          { rotateX: `${rotateX.value}deg` },
          { rotateY: `${rotateY.value}deg` },
        ]
      : [],
  }));

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (Platform.OS !== "web") return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rotateY.value = withTiming((x - 0.5) * 12, { duration: 80 });
    rotateX.value = withTiming((y - 0.5) * -12, { duration: 80 });
    glareX.value = x * 100;
    glareY.value = y * 100;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (Platform.OS !== "web") return;
    rotateX.value = withTiming(0, { duration: 400 });
    rotateY.value = withTiming(0, { duration: 400 });
    glareX.value = withTiming(50, { duration: 400 });
    glareY.value = withTiming(50, { duration: 400 });
  }, []);

  return (
    <Animated.View
      {...(Platform.OS === "web" ? {
        onMouseMove: handleMouseMove as any,
        onMouseLeave: handleMouseLeave as any,
      } : {})}
      style={[tiltStyle, outerStyle]}
    >
      <View
        style={[
          {
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            pointerEvents: "none" as any,
            zIndex: 1,
          },
          Platform.OS === "web" && {
            backgroundImage: `radial-gradient(circle at ${glareX.value}% ${glareY.value}%, rgba(255,255,255,0.06) 0%, transparent 60%)`,
          } as any,
        ].filter(Boolean)}
      />
      {children}
    </Animated.View>
  );
}

function AnnonceCard({ item, index }: { item: Annonce; index: number }) {
  const theme = useTheme();
  const isFirst = index === 0;
  const [hovered, setHovered] = useState(false);

  const cardEnter = isFirst
    ? FadeInDown.duration(500).springify().damping(14)
    : FadeInRight.delay(index * 100).duration(400).springify().damping(18);

  return (
    <TiltCard>
      <Pressable
        onPress={() => router.push({ pathname: "/annonces/[id]", params: { id: item._id } })}
      >
        <Animated.View
          entering={cardEnter}
          style={[
            styles.card,
            {
              backgroundColor: isFirst ? theme.accentDim : theme.surface,
              borderColor: isFirst ? theme.accent : theme.accentDim,
            },
            hovered && Platform.OS === "web" && { transform: [{ translateY: -4 }] },
          ]}
          {...(Platform.OS === "web" ? {
            onMouseEnter: () => setHovered(true),
            onMouseLeave: () => setHovered(false),
          } : {})}
        >
          <View
            style={[
              styles.cardAccent,
              { backgroundColor: theme.accent, width: isFirst ? 6 : 3 },
            ]}
          />
          <View style={styles.cardBody}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>{item.titre}</Text>
              {isFirst && (
                <Animated.View
                  entering={FadeIn.duration(300).delay(400)}
                  style={[styles.featuredTag, { backgroundColor: theme.accent }]}
                >
                  <Text style={styles.featuredTagText}>COUP DE CŒUR</Text>
                </Animated.View>
              )}
            </View>
            <Text style={[styles.cardDesc, { color: theme.textSecondary }]} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.cardFooter}>
              <Animated.View
                entering={FadeInUp.duration(300).springify().damping(12)}
                style={[styles.pricePill, { backgroundColor: theme.accent }]}
              >
                <Text style={styles.priceText}>
                  {item.prix.toLocaleString("fr-FR")} €
                </Text>
              </Animated.View>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </TiltCard>
  );
}

function StatCard({ value, label, accent, index }: { value: string; label: string; accent: string; index: number }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 120).duration(500).springify().damping(9)}
      style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.accentDim }]}
    >
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </Animated.View>
  );
}

function StepCard({ number, title, desc, accent }: { number: number; title: string; desc: string; accent: string }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.delay(number * 150).duration(400).springify().damping(9)}
      style={styles.stepWrapper}
    >
      <Animated.View
        entering={FadeInDown.delay(number * 150 + 100).duration(300).springify().damping(10)}
        style={[styles.stepDot, { backgroundColor: accent }]}
      >
        <Text style={styles.stepDotText}>{number}</Text>
      </Animated.View>
      <Text style={[styles.stepTitle, { color: theme.text }]}>{title}</Text>
      <Text style={[styles.stepDesc, { color: theme.textSecondary }]}>{desc}</Text>
    </Animated.View>
  );
}

function WhyRow({ number, title, desc, accent }: { number: number; title: string; desc: string; accent: string }) {
  const theme = useTheme();
  const accentW = useSharedValue(0);
  const rotateZ = useSharedValue(180);

  useEffect(() => {
    accentW.value = withDelay(number * 200, withTiming(3, { duration: 400 }));
    rotateZ.value = withDelay(number * 200 + 100, withSpring(0, { damping: 10 }));
  }, []);

  const accentStyle = useAnimatedStyle(() => ({ width: accentW.value }));
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ rotateZ: `${rotateZ.value}deg` }] }));

  return (
    <Animated.View
      entering={FadeInLeft.delay(number * 120).duration(400).springify()}
      style={[styles.whyRow, { backgroundColor: theme.surface, borderColor: theme.accentDim }]}
    >
      <Animated.View style={[styles.whyAccent, { backgroundColor: accent }, accentStyle]} />
      <View style={styles.whyBody}>
        <Animated.View style={[styles.whyNumber, { backgroundColor: theme.accentDim }, numberStyle]}>
          <Text style={[styles.whyNumberText, { color: accent }]}>
            {String(number).padStart(2, "0")}
          </Text>
        </Animated.View>
        <View style={styles.whyTextBlock}>
          <Text style={[styles.whyTitle, { color: theme.text }]}>{title}</Text>
          <Text style={[styles.whyDesc, { color: theme.textSecondary }]}>{desc}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function CategoryCard({ label, icon, accent, index }: { label: string; icon: string; accent: string; index: number }) {
  const theme = useTheme();
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 80).duration(400).springify().damping(8)}
    >
      <Pressable onPress={() => router.push("/annonces/creer")}>
        <TiltCard>
          <View style={[styles.catCard, { backgroundColor: theme.surface, borderColor: theme.accentDim }]}>
            <Text style={[styles.catIcon, { color: accent }]}>{icon}</Text>
            <Text style={[styles.catLabel, { color: theme.text }]}>{label}</Text>
          </View>
        </TiltCard>
      </Pressable>
    </Animated.View>
  );
}

function TestimonialCard({ quote, author, role, index }: { quote: string; author: string; role: string; index: number }) {
  const theme = useTheme();
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 150, withSpring(1, { damping: 12 }));
    opacity.value = withDelay(index * 150 + 50, withTiming(1, { duration: 300 }));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View entering={FadeInUp.delay(index * 120).duration(400).springify().damping(10)}>
      <TiltCard>
        <Animated.View style={[styles.testimonialCard, { backgroundColor: theme.surface, borderColor: theme.accentDim }, cardStyle]}>
          <View style={[styles.testimonialQuote, { backgroundColor: theme.accent }]}>
            <Text style={styles.testimonialQuoteText}>"</Text>
          </View>
          <Text style={[styles.testimonialQuoteBody, { color: theme.text }]}>{quote}</Text>
          <View style={[styles.testimonialDivider, { backgroundColor: theme.accentDim }]} />
          <Text style={[styles.testimonialAuthor, { color: theme.accent }]}>{author}</Text>
          <Text style={[styles.testimonialRole, { color: theme.textSecondary }]}>{role}</Text>
        </Animated.View>
      </TiltCard>
    </Animated.View>
  );
}

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const height = useSharedValue(0);
  const chevron = useSharedValue(0);

  const toggle = useCallback(() => {
    if (open) {
      height.value = withTiming(0, { duration: 250 });
      chevron.value = withTiming(0, { duration: 250 });
    } else {
      height.value = withTiming(80, { duration: 300 });
      chevron.value = withTiming(180, { duration: 300 });
    }
    setOpen(!open);
  }, [open]);

  const bodyStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: height.value === 0 ? 0 : withTiming(1, { duration: 200 }),
    overflow: "hidden",
  }));

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${chevron.value}deg` }],
  }));

  return (
    <Animated.View
      entering={FadeInLeft.delay(index * 80).duration(350).springify()}
      style={[styles.faqItem, { borderColor: theme.accentDim }]}
    >
      <Pressable onPress={toggle} style={styles.faqHeader}>
        <Text style={[styles.faqQuestion, { color: theme.text }]}>{question}</Text>
        <Animated.View style={chevronStyle}>
          <Text style={[styles.faqChevron, { color: theme.accent }]}>+</Text>
        </Animated.View>
      </Pressable>
      <Animated.View style={bodyStyle}>
        <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{answer}</Text>
      </Animated.View>
    </Animated.View>
  );
}

export default function Annonces() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [state, setState] = useState<State>({ type: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [promptIndex, setPromptIndex] = useState(0);
  const inputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((p) => (p + 1) % SEARCH_PROMPTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnnonces = useCallback(async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data: Annonce[] = await res.json();
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

  useEffect(() => { fetchAnnonces(); }, [fetchAnnonces]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnnonces();
    setRefreshing(false);
  }, [fetchAnnonces]);

  const totalAnnonces = state.type === "data" ? state.items.length : 0;
  const animatedCount = useCounter(totalAnnonces);

  const filteredAnnonces = state.type === "data"
    ? searchQuery
      ? state.items.filter(
          (a) =>
            a.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : state.items
    : [];

  const displayItems = filteredAnnonces.slice(0, 4);

  const topInset = Platform.OS === "web" ? Spacing.six : insets.top + Spacing.three;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <AmbientOrb size={180} x={-40} y={80} durationX={7000} durationY={9000} color={theme.accent} />
      <AmbientOrb size={120} x={WINDOW_W - 100} y={300} durationX={11000} durationY={13000} color={theme.accent} />
      <AmbientOrb size={90} x={WINDOW_W * 0.3} y={500} durationX={8000} durationY={11000} color={theme.accentGlow} />

      <ScrollView
        ref={scrollRef}
        style={[styles.screen, { backgroundColor: "transparent" }]}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topInset,
            paddingBottom: insets.bottom + BottomTabInset + Spacing.four,
          },
        ]}
        refreshControl={
          Platform.OS !== "web" ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />
          ) : undefined
        }
      >
        {/* ───── HERO ───── */}
        <Animated.View entering={FadeInLeft.duration(700).springify().damping(22)}>
          <Text style={[styles.headline, { color: theme.text }]}>
            Des annonces{"\n"}qui ont de la{" "}
            <Text style={{ color: theme.accent }}>gueule</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Pas de blabla, que de bonnes affaires.
          </Text>

          <Animated.View
            entering={FadeInUp.duration(500).delay(300).springify().damping(14)}
            style={styles.heroActions}
          >
            <AnimatedInput
              ref={inputRef}
              containerStyle={styles.searchBar}
              placeholder={SEARCH_PROMPTS[promptIndex]}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable
              onPress={() => router.push("/annonces/creer")}
              style={({ pressed }) => [
                styles.createBtn,
                { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.createBtnText}>Publier</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        {/* ───── DIVIDER ───── */}
        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.accentDim }]} />
          <PulseDot />
          <View style={[styles.dividerLine, { backgroundColor: theme.accentDim }]} />
        </View>

        {/* ───── STATS ───── */}
        <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.statsRow}>
          <StatCard value={`${animatedCount}`} label="annonces dispo" accent={theme.accent} index={0} />
          <StatCard value={totalAnnonces > 0 ? "Immediat" : "---"} label="mise en ligne" accent={theme.accent} index={1} />
          <StatCard value="100%" label="gratuit" accent={theme.accent} index={2} />
        </Animated.View>

        {/* ───── HOW IT WORKS ───── */}
        <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Trois clics, pas un de plus</Text>

          <View style={styles.stepsRow}>
            <StepCard number={1} title="Publiez" desc="Ca vous prend 30 secondes, promis" accent={theme.accent} />
            <View style={[styles.stepConnector, { backgroundColor: theme.accentDim }]} />
            <StepCard number={2} title="Matchez" desc="L'algorithme fait le reste" accent={theme.accent} />
            <View style={[styles.stepConnector, { backgroundColor: theme.accentDim }]} />
            <StepCard number={3} title="Concluez" desc="A la poignee de main ou en 2 clics" accent={theme.accent} />
          </View>
        </Animated.View>

        {/* ───── CATEGORIES ───── */}
        {/* <Animated.View entering={FadeIn.duration(400).delay(350)} style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>PARCOURIR</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Categorie</Text>

          <View style={styles.catGrid}>
            <CategoryCard label="Vehicules" icon=">" accent={theme.accent} index={0} />
            <CategoryCard label="Immobilier" icon=">" accent={theme.accent} index={1} />
            <CategoryCard label="Emploi" icon=">" accent={theme.accent} index={2} />
            <CategoryCard label="Services" icon=">" accent={theme.accent} index={3} />
          </View>
        </Animated.View> */}

        {/* ───── LISTING ───── */}
        <Animated.View entering={FadeIn.duration(400).delay(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {searchQuery
              ? `${displayItems.length} resultat${displayItems.length > 1 ? "s" : ""}`
              : totalAnnonces > 4
                ? "4 dernières annonces"
                : "Toutes les annonces"}
          </Text>

          <View style={styles.list}>
            {state.type === "loading" && !refreshing && (
              <View style={styles.list}>
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
                  onPress={fetchAnnonces}
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
                  Aucune annonce pour le moment. Revenez plus tard.
                </Text>
              </View>
            )}

            {state.type === "data" && (
              <>
                {refreshing && (
                  <ActivityIndicator size="small" color={theme.accent} style={styles.refreshIndicator} />
                )}
                {searchQuery && displayItems.length === 0 ? (
                  <View style={styles.centerState}>
                    <Text style={[styles.stateTitle, { color: theme.text }]}>Aucun resultat</Text>
                    <Text style={[styles.stateDesc, { color: theme.textSecondary }]}>
                      Essayez un autre terme de recherche
                    </Text>
                  </View>
                ) : (
                  displayItems.map((item, i) => (
                    <AnnonceCard key={item._id} item={item} index={i} />
                  ))
                )}

                {!searchQuery && totalAnnonces > 4 && (
                  <Pressable
                    onPress={() => router.push("/explore")}
                    style={({ pressed }) => [styles.viewAllBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={[styles.viewAllText, { color: theme.accent }]}>
                      Voir toutes les annonces ({totalAnnonces})
                    </Text>
                  </Pressable>
                )}
              </>
            )}
          </View>
        </Animated.View>

        {/* ───── WHY CHOOSE US ───── */}
        <Animated.View entering={FadeIn.duration(400).delay(500)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>On a pensée a tout (vraiment tout)</Text>

          <View style={styles.whyList}>
            <WhyRow number={1} title="Instantané" desc="Votre annonce en ligne avant que vous ayez change d'avis" accent={theme.accent} />
            <WhyRow number={2} title="Planque" desc="Personne ne fouine, pas meme nous" accent={theme.accent} />
            <WhyRow number={3} title="Gratuit. Sans piege." desc="Pas de frais, pas d'abonnement, pas de surprise" accent={theme.accent} />
          </View>
        </Animated.View>

        {/* ───── TESTIMONIALS ───── */}
        <Animated.View entering={FadeIn.duration(400).delay(550)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ils ont essayés, ils approuvent</Text>

          <View style={styles.testimonialList}>
            <TestimonialCard
              quote="Vendu en 48h chrono. Le mec est arrivé avec les billets, j'ai meme pas eu le temps de negocier."
              author="Sophie M."
              role="Vendeuse, Bordeaux"
              index={0}
            />
            <TestimonialCard
              quote="Je cherchais un studio depuis des mois. J'ai trouve le bon plan ici en un week-end."
              author="Lucas K."
              role="Locataire, Lyon"
              index={1}
            />
          </View>
        </Animated.View>

        {/* ───── FAQ ───── */}
        <Animated.View entering={FadeIn.duration(400).delay(600)} style={styles.section}>
          <Text style={[styles.sectionEyebrow, { color: theme.accent }]}>QUESTIONS</Text>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tout ce que vous vous demandez</Text>

          <View style={styles.faqList}>
            <FAQItem
              question="C'est vraiment gratuit ?"
              answer="Oui. Zero euro. Pas de frais cache, pas d'abonnement. On gagne rien du tout sur votre poche."
              index={0}
            />
            <FAQItem
              question="Combien de temps pour etre en ligne ?"
              answer="Une fois que vous publiez, c'est en ligne dans la minute. Pas de validation manuelle, pas d'attente."
              index={1}
            />
            <FAQItem
              question="Je peux modifier mon annonce ?"
              answer="Tout le temps. Vous editez, le site met a jour. Aucune limite."
              index={2}
            />
            <FAQItem
              question="Et si ca ne se vend pas ?"
              answer="Ca arrive. Vous pouvez republier gratuitement quand vous voulez. Pas de penalty."
              index={3}
            />
          </View>
        </Animated.View>

        {/* ───── FINAL CTA ───── */}
        <Animated.View
          entering={FadeInUp.duration(600).delay(700).springify().damping(14)}
          style={[styles.ctaSection, { backgroundColor: theme.accentDim, borderColor: theme.accentDim }]}
        >
          <Text style={[styles.ctaTitle, { color: theme.text }]}>Un truc qui traine ?</Text>
          <Text style={[styles.ctaDesc, { color: theme.textSecondary }]}>
            Publiez votre annonce gratuitement et trouvez des acheteurs rapidement
          </Text>
          <Pressable
            onPress={() => router.push("/annonces/creer")}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: theme.accent, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.ctaBtnText}>Allez, lancez-vous</Text>
          </Pressable>
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

  pulseDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#74C4DD",
  },

  /* ─── Hero ─── */
  eyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.12,
    marginBottom: 8,
  },
  headline: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.02,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 22,
    marginTop: 6,
  },
  searchBar: {
    paddingHorizontal: 14,
    height: 44,
    marginTop: Spacing.three,
    zIndex: 1,
  },
  heroActions: {
    gap: 10,
    marginTop: Spacing.three,
  },
  createBtn: {
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: "center",
  },
  createBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  /* ─── Divider ─── */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: Spacing.four,
    marginBottom: Spacing.three,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },

  /* ─── Stats ─── */
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.02,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.04,
    marginTop: 4,
  },

  /* ─── Sections ─── */
  section: {
    marginTop: Spacing.five,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.1,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.015,
    lineHeight: 28,
    marginBottom: Spacing.three,
  },

  /* ─── Steps ─── */
  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 0,
  },
  stepWrapper: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  stepDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  stepDotText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 16,
  },
  stepConnector: {
    width: 1,
    height: 24,
    marginTop: 8,
    alignSelf: "center",
  },

  /* ─── Categories ─── */
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catCard: {
    width: (WINDOW_W - Spacing.four * 2 - 10) / 2 - 5,
    minWidth: 120,
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  catIcon: {
    fontSize: 22,
    fontWeight: "700",
  },
  catLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  /* ─── Cards ─── */
  list: {
    gap: 12,
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
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
    flexShrink: 1,
  },
  featuredTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    flexShrink: 0,
  },
  featuredTagText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.06,
  },
  cardDesc: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    marginTop: 6,
  },
  cardFooter: {
    flexDirection: "row",
    marginTop: 12,
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

  /* ─── Skeletons ─── */
  skeletonShimmer: {
    width: 3,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 60,
    height: 22,
    borderRadius: 100,
    marginTop: 12,
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

  /* ─── Why Rows ─── */
  whyList: {
    gap: 10,
  },
  whyRow: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  whyAccent: {
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  whyBody: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.three,
    gap: 14,
  },
  whyNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  whyNumberText: {
    fontSize: 12,
    fontWeight: "700",
  },
  whyTextBlock: {
    flex: 1,
  },
  whyTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  whyDesc: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },

  /* ─── Testimonials ─── */
  testimonialList: {
    gap: 14,
  },
  testimonialCard: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  testimonialQuote: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  testimonialQuoteText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 20,
  },
  testimonialQuoteBody: {
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
    fontStyle: "italic",
  },
  testimonialDivider: {
    height: 1,
    width: 40,
  },
  testimonialAuthor: {
    fontSize: 13,
    fontWeight: "600",
  },
  testimonialRole: {
    fontSize: 11,
    fontWeight: "400",
  },

  /* ─── FAQ ─── */
  faqList: {
    gap: 8,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: Spacing.three,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  faqChevron: {
    fontSize: 20,
    fontWeight: "400",
    lineHeight: 22,
  },
  faqAnswer: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },

  /* ─── CTA ─── */
  ctaSection: {
    marginTop: Spacing.five,
    alignItems: "center",
    padding: Spacing.four,
    borderRadius: 16,
    borderWidth: 1,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.015,
  },
  ctaDesc: {
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 18,
    marginTop: 8,
  },
  viewAllBtn: {
    alignSelf: "center",
    marginTop: Spacing.two,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },

  ctaBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: Spacing.three,
  },
  ctaBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
