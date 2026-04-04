/**
 * ThinkingStrip — Inline AI thinking bubble.
 *
 * Lifecycle driven by [category].tsx:
 *   1. visible=true, steps=undefined  → spinner + "Nivedan AI is thinking…"
 *   2. visible=true, steps=[...]      → spinner + model-generated steps (one-by-one reveal)
 *   3. visible=false                  → hides cleanly (response already in chat above)
 *
 * No hardcoded phrases. All step text comes from the /agent/thinking backend call.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../constants/theme";

interface Props {
  visible: boolean;
  steps?: string[];
  onDone?: () => void;
}

const SPIN_SIZE = 16;

export default function ThinkingStrip({ visible, steps, onDone }: Props) {
  const theme = useTheme();

  const spinVal = useRef(new Animated.Value(0)).current;

  const [phase, setPhase]               = useState<"hidden" | "thinking" | "steps">("hidden");
  const [revealedCount, setRevealed]    = useState(0);

  // ── Phase transitions ───────────────────────────────────────────────────────

  useEffect(() => {
    if (visible) {
      setPhase("thinking");
      setRevealed(0);
    } else {
      // Hide immediately — response is already in the chat, no lingering
      setPhase("hidden");
      onDone?.();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // When steps arrive while still loading, switch to steps phase
  useEffect(() => {
    if (visible && steps && steps.length > 0) {
      setRevealed(0);
      setPhase("steps");
    }
  }, [steps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reveal steps one-by-one
  useEffect(() => {
    if (phase !== "steps" || !steps || revealedCount >= steps.length) return;
    const t = setTimeout(() => setRevealed((c) => c + 1), 420);
    return () => clearTimeout(t);
  }, [phase, revealedCount, steps]);

  // ── Spinner ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase === "hidden") return;
    spinVal.setValue(0);
    const anim = Animated.loop(
      Animated.timing(spinVal, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [phase, spinVal]);


  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === "hidden") return null;

  const spin = spinVal.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={s.wrap}>
      {/* Agent label */}
      <View style={s.labelRow}>
        <View style={[s.avatarCircle, { backgroundColor: theme.primaryContainer }]}>
          <Ionicons name="hardware-chip-outline" size={11} color={theme.primary} />
        </View>
        <Text style={[s.agentLabel, { color: theme.subtext }]}>NIVEDAN AI</Text>
      </View>

      {/* Thinking bubble */}
      <View style={[s.bubble, { backgroundColor: theme.surface }]}>

        {/* Spinner row — always shown */}
        <View style={s.spinnerRow}>
          <View style={s.spinWrap}>
            <View style={[s.spinTrack, { borderColor: theme.surfaceContainerHigh }]} />
            <Animated.View
              style={[
                s.spinArc,
                {
                  borderTopColor:    theme.primary,
                  borderRightColor:  theme.primary,
                  borderBottomColor: "transparent",
                  borderLeftColor:   "transparent",
                },
                { transform: [{ rotate: spin }] },
              ]}
            />
          </View>

          <Text style={[s.statusText, { color: theme.subtext }]}>
            {phase === "thinking" ? "Nivedan AI is thinking…" : "Nivedan AI is working…"}
          </Text>
        </View>

        {/* Steps — revealed one by one as they arrive */}
        {phase === "steps" && steps && revealedCount > 0 && (
          <View style={s.stepsWrap}>
            {steps.slice(0, revealedCount).map((step, i) => (
              <StepRow key={i} text={step} theme={theme} />
            ))}
          </View>
        )}
      </View>

    </View>
  );
}

// ── Animated step row ──────────────────────────────────────────────────────────

function StepRow({ text, theme }: { text: string; theme: ReturnType<typeof useTheme> }) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[s.stepRow, { opacity, transform: [{ translateY }] }]}>
      <View style={[s.stepDot, { backgroundColor: theme.primary }]} />
      <Text style={[s.stepText, { color: theme.text }]}>{text}</Text>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: { gap: 6 },

  labelRow: { flexDirection: "row", alignItems: "center", gap: 5, marginLeft: 2 },
  avatarCircle: {
    width: 22, height: 22, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  agentLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8 },

  bubble: {
    borderRadius: 18,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    shadowColor: "#1B2A4A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },

  spinnerRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  spinWrap: { width: SPIN_SIZE, height: SPIN_SIZE, flexShrink: 0 },
  spinTrack: {
    position: "absolute",
    width: SPIN_SIZE, height: SPIN_SIZE,
    borderRadius: SPIN_SIZE / 2,
    borderWidth: 2,
  },
  spinArc: {
    position: "absolute",
    width: SPIN_SIZE, height: SPIN_SIZE,
    borderRadius: SPIN_SIZE / 2,
    borderWidth: 2,
  },

  statusText: { fontSize: 14, fontStyle: "italic", flexShrink: 1 },

  // Steps list
  stepsWrap: { gap: 6, paddingLeft: 2 },
  stepRow:   { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  stepDot:   { width: 5, height: 5, borderRadius: 3, marginTop: 6, flexShrink: 0 },
  stepText:  { fontSize: 13, lineHeight: 19, flex: 1 },

});
