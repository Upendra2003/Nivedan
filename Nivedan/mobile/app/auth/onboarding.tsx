import React, { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { saveSecure } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";

const PRIMARY = "#6366F1";
const LOGO    = require("../../assets/images/LOGO.png");

const SLIDES = [
  {
    image:  require("../../assets/vectors/CarouselImage1.png"),
    accent: "#EDE9FE",
    title:  "Got a problem\nwith the system?",
    body:   "From unpaid salaries to cyber fraud, Nivedan covers every civic grievance you face.",
  },
  {
    image:  require("../../assets/vectors/CarouselImage2.png"),
    accent: "#FFF7ED",
    title:  "Just talk.\nOur AI does the rest.",
    body:   "No confusing forms. Describe your issue in plain language and our AI builds your complaint automatically.",
  },
  {
    image:  require("../../assets/vectors/CarouselImage3.png"),
    accent: "#ECFDF5",
    title:  "Filed in seconds.\nOfficially.",
    body:   "Your complaint reaches the right authority instantly. Labour Commissioner, Consumer Forum, Cyber Cell and more.",
  },
  {
    image:  require("../../assets/vectors/CarouselImage4.png"),
    accent: "#EFF6FF",
    title:  "Track every step.\nGet closure.",
    body:   "Know exactly where your case stands. From filing to final resolution, right in your pocket.",
  },
];

export default function OnboardingScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user } = useAuth();
  const { width, height } = useWindowDimensions();
  const [idx, setIdx] = useState(0);
  const flatRef = useRef<FlatList>(null);

  // Controls bar height (brand row + dots + button + safe bottom)
  const controlsHeight = 56 + 24 + 52 + Math.max(insets.bottom + 12, 24);
  // Image area takes upper portion
  const imageAreaHeight = height * 0.52;
  // Card takes the rest
  const cardHeight = height - imageAreaHeight;

  const onViewChange = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setIdx(viewableItems[0].index ?? 0);
  }, []);
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const finish = async () => {
    await saveSecure("hasSeenOnboarding", "true");
    router.replace(user ? "/(tabs)" : "/auth/login");
  };

  const handleNext = () => {
    if (idx < SLIDES.length - 1) {
      flatRef.current?.scrollToIndex({ index: idx + 1, animated: true });
    } else {
      finish();
    }
  };

  const isLast = idx === SLIDES.length - 1;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Skip ───────────────────────────────────────────────────────── */}
      {!isLast && (
        <TouchableOpacity style={s.skipBtn} onPress={finish} activeOpacity={0.7}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* ── Carousel ───────────────────────────────────────────────────── */}
      <FlatList
        ref={flatRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        keyExtractor={(_, i) => String(i)}
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewChange}
        viewabilityConfig={viewConfig}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <View style={{ width, flex: 1 }}>

            {/* Illustration area — contain so nothing is cropped */}
            <View style={[s.imageArea, { height: imageAreaHeight, backgroundColor: item.accent }]}>
              <Image
                source={item.image}
                style={s.illustration}
                resizeMode="contain"
              />
            </View>

            {/* Text card below image */}
            <View style={[s.slideCard, { paddingBottom: controlsHeight }]}>
              <Text style={s.slideTitle}>{item.title}</Text>
              <Text style={s.slideBody}>{item.body}</Text>
            </View>

          </View>
        )}
      />

      {/* ── Controls (overlaid on card padding area) ────────────────────── */}
      <View style={[s.controls, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>

        <View style={s.brandRow}>
          <Image source={LOGO} style={s.brandLogo} resizeMode="contain" />
          <Text style={s.brandName}>Nivedan</Text>
        </View>

        <View style={s.bottomRow}>
          <View style={s.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  s.dot,
                  i === idx
                    ? { width: 28, backgroundColor: PRIMARY }
                    : { width: 8,  backgroundColor: PRIMARY + "28" },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={s.nextBtn} onPress={handleNext} activeOpacity={0.85}>
            <Text style={s.nextBtnText}>{isLast ? "Get Started" : "Next"}</Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  skipBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    zIndex: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(99,102,241,0.1)",
    borderRadius: 100,
  },
  skipText: { fontSize: 13, fontWeight: "600", color: PRIMARY },

  // Illustration
  imageArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
  },
  illustration: { width: "100%", height: "100%" },

  // Text card
  slideCard: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B2A4A",
    lineHeight: 34,
    marginBottom: 12,
  },
  slideBody: {
    fontSize: 15,
    color: "#6B7280",
    lineHeight: 24,
  },

  // Controls bar
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 28,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  brandLogo: { width: 22, height: 22 },
  brandName: { fontSize: 15, fontWeight: "800", color: PRIMARY, letterSpacing: -0.2 },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot:  { height: 8, borderRadius: 4 },

  nextBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 100,
    paddingVertical: 14,
    paddingHorizontal: 32,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  nextBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
