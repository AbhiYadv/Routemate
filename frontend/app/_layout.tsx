import { Redirect, Slot, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuthStore } from '../src/store/auth';
import { View, ActivityIndicator } from 'react-native';
import tw from 'twrnc';

// Module-level flag: survives component remounts within a single page session.
// Prevents checkAuth from firing on every expo-router layout re-mount during navigation.
let _authInitialized = false;

export default function RootLayout() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();

  useEffect(() => {
    if (_authInitialized) return;
    _authInitialized = true;
    checkAuth();
  }, []);

  const seg0 = segments[0] ?? '';
  const inProtectedRoute = seg0 === '(employee)' || seg0 === '(admin)';

  // Only block rendering with a spinner while auth is loading AND we're in a
  // protected route — public routes (landing, login) show instantly.
  if (isLoading && inProtectedRoute) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#1d4ed8" />
      </View>
    );
  }

  // Unauthenticated in protected route → login
  if (!isLoading && !user && inProtectedRoute) {
    return <Redirect href="/login" />;
  }

  // Authenticated on a public page → correct group
  if (!isLoading && user) {
    if ((user.role === 'EMPLOYEE' || user.role === 'DRIVER') && seg0 !== '(employee)') {
      return <Redirect href="/(employee)" />;
    }
    if (user.role === 'COMPANY_ADMIN' && seg0 !== '(admin)') {
      return <Redirect href="/(admin)" />;
    }
  }

  return <Slot />;
}
