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

    // Protected route groups — any session-required screen lives here
    const inProtectedRoute =
      segments[0] === '(employee)' || segments[0] === '(admin)';

    if (!user) {
      // Not authenticated: if we're inside a protected route, kick back to root.
      // This is the ONLY place that navigates after logout — profile.tsx must NOT
      // call router.replace('/') because it runs inside the tab navigator and
      // resolves to the tab's own home, not the app root.
      if (inProtectedRoute) {
        router.replace('/');
      }
    } else {
      // Authenticated: send to the correct group for the user's role
      const inEmployeeGroup = segments[0] === '(employee)';
      const inAdminGroup = segments[0] === '(admin)';

      if (user.role === 'EMPLOYEE' || user.role === 'DRIVER') {
        if (!inEmployeeGroup) router.replace('/(employee)');
      } else if (user.role === 'COMPANY_ADMIN') {
        if (!inAdminGroup) router.replace('/(admin)');
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
