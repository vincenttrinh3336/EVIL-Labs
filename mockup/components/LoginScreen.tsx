import React from "react";
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from "react-native";
import { MotiView } from "moti";
import { Mail, Lock } from "lucide-react-native";
import { Svg, Path } from "react-native-svg";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        {/* Paw print background (Opacity 5%) */}
        <View style={StyleSheet.absoluteFill}>
          {[...Array(15)].map((_, i) => (
            <Text
              key={i}
              style={[
                styles.paw,
                {
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  transform: [{ rotate: `${Math.random() * 360}deg` }],
                },
              ]}
            >
              🐾
            </Text>
          ))}
        </View>

        <View style={styles.innerContainer}>
          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.header}
          >
            <View style={styles.logoBadge}>
              <Text style={{ fontSize: 50 }}>🍽️</Text>
            </View>
            <Text style={styles.headline}>Welcome Back</Text>
            <Text style={styles.subheadline}>Sign in to continue</Text>
          </MotiView>

          {/* Form */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 200 }}
            style={styles.form}
          >
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="your@email.com"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  placeholder="••••••••"
                  placeholderTextColor="#999"
                  secureTextEntry
                  style={styles.input}
                />
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.linkText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity 
              activeOpacity={0.8} 
              onPress={onLogin} 
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.outlineButton}>
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <Path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <Path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <Path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </Svg>
                <Text style={styles.outlineButtonText}>Google</Text>
              </TouchableOpacity>
            </View>
          </MotiView>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    padding: 24,
  },
  paw: {
    position: "absolute",
    fontSize: 60,
    opacity: 0.05,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  logoBadge: {
    backgroundColor: "#5C6BC0",
    padding: 20,
    borderRadius: 100,
    marginBottom: 16,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  headline: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  subheadline: {
    fontSize: 16,
    color: "#666",
    marginTop: 4,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  linkText: {
    color: "#5C6BC0",
    fontWeight: "600",
  },
  loginButton: {
    backgroundColor: "#5C6BC0",
    height: 54,
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  loginButtonText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#999",
  },
  socialContainer: {
    flexDirection: "row",
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    flexDirection: "row",
    height: 54,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  outlineButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingVertical: 20,
  },
  footerText: {
    color: "#666",
  },
});