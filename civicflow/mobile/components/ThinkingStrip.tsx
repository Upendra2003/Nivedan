/**
 * ThinkingStrip — Claude-like "agent is thinking" panel.
 *
 * While visible=true:  show cycling "loading" steps with pulse dot.
 * When steps prop changes (new response): animate them in one-by-one,
 * then hold briefly before hiding via onDone callback.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../constants/theme";

interface Props {
  visible: boolean;
  steps?: string[];        // thinking steps from last backend response
  onDone?: () => void;     // called after steps finish displaying (auto-hide)
}

const LOADING_LABELS = [
  "Thinking...",
  "Processing...",
  "Reasoning...",
  "Analysing...",
];

export default function ThinkingStrip({ visible, steps, onDone }: Props) {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(1)).current;

  // "loading" phase — cycling labels while API call is in progress
  const [loadingIndex, setLoadingIndex] = useState(0);
  // "reveal" phase — steps appearing one by one after response arrives
  const [revealedCount, setRevealedCount] = useState(0);
  const [phase, setPhase] = useState<"loading" | "reveal" | "hidden">("hidden");

  // Enter loading phase when visible becomes true
  useEffect(() => {
    if (visible) {
      setPhase("loading");
      setRevealedCount(0);
      setLoadingIndex(0);
    }
  }, [visible]);

  // When steps arrive (visible false → steps provided) → reveal phase
  useEffect(() => {
    if (!visible && steps && steps.length > 0) {
      setRevealedCount(0);
      setPhase("reveal");
    }
  }, [steps, visible]);

  // Cycle loading labels
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setInterval(() => setLoadingIndex((i) => (i + 1) % LOADING_LABELS.length), 900);
    return () => clearInterval(t);
  }, [phase]);

  // Pulse dot animation
  useEffect(() => {
    if (phase === "hidden") return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,   duration: 500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [phase, pulse]);

  // Reveal steps one by one
  useEffect(() => {
    if (phase !== "reveal" || !steps || steps.length === 0) return;
    if (revealedCount < steps.length) {
      const t = setTimeout(() => setRevealedCount((c) => c + 1), 350);
      return () => clearTimeout(t);
    } else {
      // All revealed — hold 1.8s then call onDone
      const t = setTimeout(() => {
        setPhase("hidden");
        onDone?.();
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [phase, revealedCount, steps, onDone]);

  if (phase === "hidden") return null;

  return (
    <View style={[s.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {/* Header row */}
      <View style={s.headerRow}>
        <Animated.View style={[s.dot, { opacity: pulse, backgroundColor: theme.primary }]} />
        <Text style={[s.headerText, { color: theme.primary }]}>
          {phase === "loading" ? LOADING_LABELS[loadingIndex] : "Agent worked through"}
        </Text>
      </View>

      {/* Steps (reveal phase) */}
      {phase === "reveal" && steps && steps.slice(0, revealedCount).map((step, i) => (
        <StepLine key={i} text={step} theme={theme} index={i} />
      ))}
    </View>
  );
}

function StepLine({
  text,
  theme,
  index,
}: {
  text: string;
  theme: ReturnType<typeof useTheme>;
  index: number;
}) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(-8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.stepRow, { opacity, transform: [{ translateX }] }]}>
      <Text style={[s.stepDot, { color: "#22c55e" }]}>✓</Text>
      <Text style={[s.stepText, { color: theme.subtext }]} numberOfLines={1}>
        {text}
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 2,
  },
  dot:        { width: 7, height: 7, borderRadius: 4 },
  headerText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.3 },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 1,
  },
  stepDot:  { fontSize: 10, fontWeight: "700" },
  stepText: { fontSize: 12, flex: 1 },
});
