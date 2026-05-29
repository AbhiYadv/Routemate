import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../src/components/Logo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const router = useRouter();
  const { login, isLoading } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login(email, password);
    } catch (err: any) {
      Alert.alert("Login Failed", err.response?.data?.detail || "Invalid credentials");
    }
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC]`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow px-6 py-12`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mb-6`}>
            <Ionicons name="arrow-back" size={28} color="#0F172A" />
          </TouchableOpacity>

          <View style={tw`items-center mb-8`}>
            <Logo size="medium" />
            <Text style={tw`text-3xl font-extrabold text-[#0F172A] mt-6 mb-2`}>Welcome Back</Text>
            <Text style={tw`text-gray-500`}>Login to your RouteMate account</Text>
          </View>

          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-semibold text-[#0F172A] mb-2`}>Work Email</Text>
            <TextInput
              style={tw`w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0F172A] shadow-sm`}
              placeholder="e.g. name@nexora.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={tw`mb-8`}>
            <Text style={tw`text-sm font-semibold text-[#0F172A] mb-2`}>Password</Text>
            <TextInput
              style={tw`w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-base text-[#0F172A] shadow-sm`}
              placeholder="Enter password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={tw`w-full bg-[#2563EB] rounded-xl py-4 items-center shadow-md mb-6 ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`w-full bg-white border border-gray-200 rounded-xl py-3 items-center shadow-sm`}
            onPress={() => setShowDemo(!showDemo)}
          >
            <Text style={tw`text-gray-600 font-semibold`}>View Demo Credentials</Text>
          </TouchableOpacity>

          {showDemo && (
            <View style={tw`mt-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm`}>
              <Text style={tw`text-sm text-gray-600 mb-2`}>Employee: <Text style={tw`font-bold text-[#0F172A]`}>ananya@nexora.com</Text></Text>
              <Text style={tw`text-sm text-gray-600 mb-2`}>Driver: <Text style={tw`font-bold text-[#0F172A]`}>arjun@nexora.com</Text></Text>
              <Text style={tw`text-sm text-gray-600 mb-2`}>Admin: <Text style={tw`font-bold text-[#0F172A]`}>meera@nexora.com</Text></Text>
              <Text style={tw`text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100`}>Password for all: <Text style={tw`font-bold text-[#0F172A]`}>password123</Text></Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
