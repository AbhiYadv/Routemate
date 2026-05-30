import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../src/components/Logo';

const SHOW_DEMO = __DEV__ || process.env.EXPO_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.detail || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f0fdf4]`}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow px-6 py-12`} keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`mb-6 w-12 h-12 items-center justify-center`}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>

          <View style={tw`items-center mb-8`}>
            <Logo size="medium" />
            <Text style={tw`text-3xl font-extrabold text-[#0F172A] mt-6 mb-2`}>Welcome Back</Text>
            <Text style={tw`text-gray-500`}>Sign in to your RouteMate account</Text>
          </View>

          {/* Email */}
          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-semibold text-[#0F172A] mb-2`}>Work Email</Text>
            <TextInput
              style={tw`w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0F172A]`}
              placeholder="name@company.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel="Work email address"
            />
          </View>

          {/* Password with show/hide toggle */}
          <View style={tw`mb-8`}>
            <Text style={tw`text-sm font-semibold text-[#0F172A] mb-2`}>Password</Text>
            <View style={tw`flex-row items-center bg-white border border-gray-200 rounded-xl px-4`}>
              <TextInput
                style={tw`flex-1 py-3.5 text-base text-[#0F172A]`}
                placeholder="Enter password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                accessibilityLabel="Password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                style={tw`pl-3 py-3.5`}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={tw`w-full bg-[#1d4ed8] rounded-xl py-4 items-center shadow-md mb-6 ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityRole="button"
            accessibilityLabel={isLoading ? 'Logging in' : 'Login'}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          {/* Demo credentials — only in dev or when flag is set */}
          {SHOW_DEMO && (
            <>
              <TouchableOpacity
                style={tw`w-full bg-white border border-gray-200 rounded-xl py-3 items-center`}
                onPress={() => setShowDemo((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Toggle demo credentials"
              >
                <Text style={tw`text-gray-600 font-semibold`}>
                  {showDemo ? 'Hide' : 'View'} Demo Credentials
                </Text>
              </TouchableOpacity>

              {showDemo && (
                <View style={tw`mt-4 bg-amber-50 p-4 rounded-xl border border-amber-200`}>
                  <Text style={tw`text-amber-700 font-bold text-xs mb-3`}>DEV ONLY — not shown in production</Text>
                  <Text style={tw`text-sm text-gray-600 mb-1`}>Employee: <Text style={tw`font-bold text-[#0F172A]`}>ananya@nexora.com</Text></Text>
                  <Text style={tw`text-sm text-gray-600 mb-1`}>Driver: <Text style={tw`font-bold text-[#0F172A]`}>arjun@nexora.com</Text></Text>
                  <Text style={tw`text-sm text-gray-600 mb-1`}>Admin: <Text style={tw`font-bold text-[#0F172A]`}>meera@nexora.com</Text></Text>
                  <Text style={tw`text-sm text-gray-500 mt-2 pt-2 border-t border-amber-200`}>
                    Password: <Text style={tw`font-bold text-[#0F172A]`}>password123</Text>
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
