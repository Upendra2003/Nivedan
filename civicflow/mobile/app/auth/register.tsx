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
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

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
  const router = useRouter();
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const c = dark ? colors.dark : colors.light;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !phone.trim() || !password) {
      setError("All fields are required.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // register() stores token + sets user in context
      // Auth guard in _layout.tsx automatically redirects to /(tabs)
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

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.logo, { color: c.accent }]}>CivicFlow</Text>
        <Text style={[styles.tagline, { color: c.muted }]}>
          Your rights, in your language.
        </Text>

        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <Text style={[styles.title, { color: c.text }]}>Create account</Text>

          {error && (
            <View style={[styles.errorBox, { backgroundColor: c.errorBg }]}>
              <Text style={[styles.errorText, { color: c.error }]}>{error}</Text>
            </View>
          )}

          <Text style={[styles.label, { color: c.muted }]}>Full name</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            value={name}
            onChangeText={setName}
            placeholder="Ramesh Kumar"
            placeholderTextColor={c.placeholder}
            autoCapitalize="words"
          />

          <Text style={[styles.label, { color: c.muted }]}>Email</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={c.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.label, { color: c.muted }]}>Phone number</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91 98765 43210"
            placeholderTextColor={c.placeholder}
            keyboardType="phone-pad"
          />

          <Text style={[styles.label, { color: c.muted }]}>Password</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.inputBg, borderColor: c.border, color: c.text }]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={c.placeholder}
            secureTextEntry
          />

          <Text style={[styles.label, { color: c.muted }]}>Preferred language</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.langRow}
          >
            {LANGUAGES.map((l) => {
              const selected = l.code === lang;
              return (
                <TouchableOpacity
                  key={l.code}
                  onPress={() => setLang(l.code)}
                  style={[
                    styles.langChip,
                    {
                      backgroundColor: selected ? c.accent : c.inputBg,
                      borderColor: selected ? c.accent : c.border,
                    },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.langChipText, { color: selected ? "#fff" : c.muted }]}>
                    {l.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: c.accent }, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Create account</Text>
            }
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: c.muted }]}>Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push("/auth/login")}>
            <Text style={[styles.link, { color: c.accent }]}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = {
  dark: {
    bg: "#0d0d0d", card: "#1a1a1a", border: "#2a2a2a", inputBg: "#111111",
    text: "#f5f5f5", muted: "#888888", placeholder: "#444444",
    accent: "#7c3aed", error: "#f87171", errorBg: "#2d1515",
  },
  light: {
    bg: "#f8fafc", card: "#ffffff", border: "#e2e8f0", inputBg: "#f1f5f9",
    text: "#0f172a", muted: "#64748b", placeholder: "#94a3b8",
    accent: "#7c3aed", error: "#dc2626", errorBg: "#fef2f2",
  },
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  inner: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 },
  logo: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5, marginBottom: 4 },
  tagline: { fontSize: 14, marginBottom: 32 },
  card: { borderRadius: 16, borderWidth: 1, padding: 24 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  errorBox: { borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { fontSize: 13, fontWeight: "500" },
  label: { fontSize: 13, fontWeight: "500", marginBottom: 6 },
  input: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, marginBottom: 16,
  },
  langRow: { gap: 8, marginBottom: 20 },
  langChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  langChipText: { fontSize: 13, fontWeight: "500" },
  btn: { borderRadius: 10, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { fontSize: 14 },
  link: { fontSize: 14, fontWeight: "600" },
});
