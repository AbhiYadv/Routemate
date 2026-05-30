import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/auth';
import { View, ActivityIndicator } from 'react-native';
import tw from 'twrnc';

export default function RootLayout() {
  const { user, isLoading, checkAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    // Groups that require authentication
    const inProtectedRoute =
      segments[0] === '(employee)' || segments[0] === '(admin)';

    if (__DEV__) {
      console.log('[AuthGuard]', {
        user: user ? `${user.email} (${user.role})` : 'null',
        isLoading,
        segment: segments[0],
        inProtectedRoute,
      });
    }

    if (!user) {
      if (inProtectedRoute) {
        // Navigate to /login (explicit public route, never resolves ambiguously).
        // Using /login rather than / avoids any uncertainty about which component
        // the root index resolves to in different Expo Router versions.
        if (__DEV__) console.log('[AuthGuard] unauthenticated in protected route → /login');
        router.replace('/login');
      }
    } else {
      const inEmployeeGroup = segments[0] === '(employee)';
      const inAdminGroup    = segments[0] === '(admin)';

      if ((user.role === 'EMPLOYEE' || user.role === 'DRIVER') && !inEmployeeGroup) {
        if (__DEV__) console.log('[AuthGuard] employee not in employee group → /(employee)');
        router.replace('/(employee)');
      } else if (user.role === 'COMPANY_ADMIN' && !inAdminGroup) {
        if (__DEV__) console.log('[AuthGuard] admin not in admin group → /(admin)');
        router.replace('/(admin)');
      }
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return <Slot />;
}
