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

    const inAuthGroup = segments[0] === '(auth)';
    const inEmployeeGroup = segments[0] === '(employee)';
    const inAdminGroup = segments[0] === '(admin)';

    if (!user) {
      // If not logged in and not on a public page, go to index (Landing)
      if (segments[0] !== 'login' && segments[0] !== '') {
        router.replace('/');
      }
    } else {
      // Based on role
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
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return <Slot />;
}
