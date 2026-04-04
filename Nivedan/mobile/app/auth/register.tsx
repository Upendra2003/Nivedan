import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  Image,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../constants/theme";

const LOGO       = require("../../assets/images/LOGO.png");
const HERO_IMAGE = require("../../assets/vectors/RegisterPagePhoto.png");

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिंदी" },
  { code: "ta", label: "தமிழ்" },
  { code: "te", label: "తెలుగు" },
  { code: "kn", label: "ಕನ್ನಡ" },
  { code: "ml", label: "മലയാളം" },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const router  = useRouter();
  const theme   = useTheme();
  const insets  = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [phone,    setPhone]    = useState("");
  const [password, setPassword] = useState("");
  const [lang,     setLang]     = useState("en");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        preferred_language: lang,
      });
    } catch (e: any) {
      try {
        const parsed = JSON.parse(e.message);
        setError(parsed.error ?? "Registration failed.");
      } catch {
        setError(e.message ?? "Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const heroHeight = height * 0.30;

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero image ──────────────────────────────────────────────── */}
          <View style={[s.heroWrap, { height: heroHeight + insets.top }]}>
            <Image
              source={HERO_IMAGE}
              style={[s.heroImage, { height: heroHeight + insets.top }]}
              resizeMode="cover"
            />
          </View>

          {/* ── Card ────────────────────────────────────────────────────── */}
          <View style={[s.card, { backgroundColor: theme.surface, marginTop: -28 }]}>

            {/* Brand */}
            <View style={s.brand}>
              <Image source={LOGO} style={s.logo} resizeMode="contain" />
              <Text style={[s.appName, { color: theme.primary }]}>Nivedan</Text>
              <Text style={[s.tagline, { color: theme.subtext }]}>
                {"File Government Complaints.\nFrom Your Pocket."}
              </Text>
            </View>

            <Text style={[s.title, { color: theme.primary }]}>Create account</Text>

            {error && (
              <View style={[s.errorBox, { backgroundColor: theme.errorContainer }]}>
                <Text style={[s.errorText, { color: theme.error }]}>{error}</Text>
              </View>
            )}

            <Text style={[s.label, { color: theme.subtext }]}>Full name</Text>
            <TextInput
              style={[s.input, {
                backgroundColor: theme.surfaceContainerLow,
                color: theme.text,
                borderColor: theme.outlineVariant,
              }]}
              value={name}
              onChangeText={setName}
              placeholder="Ramesh Kumar"
              placeholderTextColor={theme.outline}
              autoCapitalize="words"
            />

            <Text style={[s.label, { color: theme.subtext }]}>Email address</Text>
            <TextInput
              style={[s.input, {
                backgroundColor: theme.surfaceContainerLow,
                color: theme.text,
                borderColor: theme.outlineVariant,
              }]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={theme.outline}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[s.label, { color: theme.subtext }]}>Phone number</Text>
            <TextInput
              style={[s.input, {
                backgroundColor: theme.surfaceContainerLow,
                color: theme.text,
                borderColor: theme.outlineVariant,
              }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91 98765 43210"
              placeholderTextColor={theme.outline}
              keyboardType="phone-pad"
            />

            <Text style={[s.label, { color: theme.subtext }]}>Password</Text>
            <TextInput
              style={[s.input, {
                backgroundColor: theme.surfaceContainerLow,
                color: theme.text,
                borderColor: theme.outlineVariant,
              }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.outline}
              secureTextEntry
            />

            {/* Language chips */}
            <Text style={[s.label, { color: theme.subtext }]}>Preferred language</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.langRow}
            >
              {LANGUAGES.map((l) => {
                const selected = l.code === lang;
                return (
                  <TouchableOpacity
                    key={l.code}
                    onPress={() => setLang(l.code)}
                    style={[
                      s.langChip,
                      selected
                        ? { backgroundColor: theme.primary, borderColor: theme.primary }
                        : { backgroundColor: theme.surfaceContainerLow, borderColor: theme.outlineVariant },
                    ]}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.langChipText, { color: selected ? "#fff" : theme.subtext }]}>
                      {l.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={[s.btn, { backgroundColor: theme.secondary, opacity: loading ? 0.7 : 1 }]}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.btnText}>Create account</Text>
              }
            </TouchableOpacity>

            {/* Footer */}
            <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <Text style={[s.footerText, { color: theme.subtext }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/auth/login")}>
                <Text style={[s.link, { color: theme.secondary }]}>Sign in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },

  heroWrap:  { width: "100%", overflow: "hidden" },
  heroImage: { width: "100%" },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 5,
  },

  brand: { alignItems: "center", marginBottom: 24 },
  logo:  { width: 48, height: 48, marginBottom: 8 },
  appName: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5, marginBottom: 6 },
  tagline: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },

  errorBox:  { borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "500" },

  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, letterSpacing: 0.3 },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 16,
  },

  langRow: { gap: 8, marginBottom: 20 },
  langChip: { borderRadius: 100, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 9 },
  langChipText: { fontSize: 13, fontWeight: "500" },

  btn: {
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#6366F1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700", letterSpacing: 0.3 },

  footer:     { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  link:       { fontSize: 14, fontWeight: "700" },
});
