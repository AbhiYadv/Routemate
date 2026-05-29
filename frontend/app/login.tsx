import { View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

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
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={tw`flex-1`}
      >
        <ScrollView contentContainerStyle={tw`flex-grow px-6 py-12`}>
          <TouchableOpacity onPress={() => router.back()} style={tw`mb-8`}>
            <Ionicons name="arrow-back" size={28} color="#374151" />
          </TouchableOpacity>

          <Text style={tw`text-3xl font-bold text-gray-900 mb-2`}>Welcome Back</Text>
          <Text style={tw`text-gray-500 mb-8`}>Login with your corporate email</Text>

          <View style={tw`mb-4`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Work Email</Text>
            <TextInput
              style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900`}
              placeholder="e.g. name@nexora.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={tw`mb-8`}>
            <Text style={tw`text-sm font-semibold text-gray-700 mb-2`}>Password</Text>
            <TextInput
              style={tw`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-base text-gray-900`}
              placeholder="Enter password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={tw`w-full bg-blue-600 rounded-xl py-4 items-center shadow-sm mb-6 ${isLoading ? 'opacity-70' : ''}`}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={tw`text-white font-bold text-lg`}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={tw`w-full bg-gray-100 rounded-xl py-3 items-center`}
            onPress={() => setShowDemo(!showDemo)}
          >
            <Text style={tw`text-gray-600 font-semibold`}>View Demo Credentials</Text>
          </TouchableOpacity>

          {showDemo && (
            <View style={tw`mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200`}>
              <Text style={tw`text-sm text-gray-600 mb-2`}>Employee: <Text style={tw`font-bold`}>ananya@nexora.com</Text></Text>
              <Text style={tw`text-sm text-gray-600 mb-2`}>Driver: <Text style={tw`font-bold`}>arjun@nexora.com</Text></Text>
              <Text style={tw`text-sm text-gray-600 mb-2`}>Admin: <Text style={tw`font-bold`}>meera@nexora.com</Text></Text>
              <Text style={tw`text-sm text-gray-600 mt-2`}>Password for all: <Text style={tw`font-bold`}>password123</Text></Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
