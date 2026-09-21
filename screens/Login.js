import React, { useState } from "react";
import { ActivityIndicator } from "react-native";
import styled from "styled-components/native";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const { signIn, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSignIn = async () => {
    setLocalError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setLocalError("Incorrect email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Card>
        <Title>Owner sign in</Title>
        <Subtitle>Sign in to manage your restaurant's orders.</Subtitle>

        <Input
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {(localError || error) && <ErrorText>{localError || error}</ErrorText>}

        <SignInButton onPress={handleSignIn} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <SignInButtonText>Sign in</SignInButtonText>
          )}
        </SignInButton>
      </Card>
    </Screen>
  );
};

const Screen = styled.View({
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "#2c3e50",
  padding: 20,
});

const Card = styled.View({
  width: "100%",
  maxWidth: 380,
  backgroundColor: "#ffffff",
  borderRadius: 16,
  padding: 24,
});

const Title = styled.Text({
  fontSize: 22,
  fontWeight: "bold",
  marginBottom: 4,
});

const Subtitle = styled.Text({
  fontSize: 14,
  color: "#6b6560",
  marginBottom: 20,
});

const Input = styled.TextInput({
  borderWidth: 1,
  borderColor: "#d9d9d9",
  borderRadius: 8,
  padding: 12,
  marginBottom: 12,
  fontSize: 15,
});

const ErrorText = styled.Text({
  color: "#c0392b",
  marginBottom: 12,
});

const SignInButton = styled.TouchableOpacity({
  backgroundColor: "#FF8C00",
  borderRadius: 8,
  padding: 14,
  alignItems: "center",
  marginTop: 4,
});

const SignInButtonText = styled.Text({
  color: "#ffffff",
  fontWeight: "bold",
  fontSize: 16,
});

export default Login;
