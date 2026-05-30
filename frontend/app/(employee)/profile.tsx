import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, Alert, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            if (__DEV__) console.log('[Logout] clearing auth state');
            await logout();
            if (__DEV__) console.log('[Logout] auth cleared — navigating to /login');
            // dismissAll clears any open modals/sheets; replace navigates to login.
            // The root auth guard in _layout.tsx also fires reactively (user → null),
            // so navigation happens via whichever path resolves first — no flicker.
            try { router.dismissAll?.(); } catch {}
            router.replace('/login');
          } catch (error) {
            setLoggingOut(false);
            // Last-resort fallback: direct assign if router navigation threw.
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.assign('/login');
            }
          }
        },
      },
    ]);
  };

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} is currently under development and will be available shortly.`);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10`}>
        {router.canGoBack() && (
          <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        )}
        <Text style={tw`text-gray-900 font-bold text-lg`}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={tw`p-6`}>
        <View style={tw`items-center mb-8`}>
          <View style={tw`w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-4`}>
            <Ionicons name="person" size={48} color="#16a34a" />
          </View>
          <Text style={tw`text-2xl font-bold text-gray-900`}>{user?.name}</Text>
          <Text style={tw`text-gray-500`}>{user?.email}</Text>
          <View style={tw`bg-green-50 px-3 py-1 rounded-full mt-2 flex-row items-center`}>
            <Ionicons name="checkmark-circle" size={14} color="#16a34a" style={tw`mr-1`} />
            <Text style={tw`text-green-700 text-xs font-semibold`}>Verified Employee</Text>
          </View>
        </View>

        <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6`}>
          <Text style={tw`font-bold text-gray-900 mb-4`}>Account Settings</Text>
          
          <TouchableOpacity onPress={() => showComingSoon('Commute Preferences')} style={tw`flex-row justify-between items-center py-3 border-b border-gray-100`}>
            <Text style={tw`text-gray-700`}>Commute Preferences</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showComingSoon('Emergency Contacts')} style={tw`flex-row justify-between items-center py-3 border-b border-gray-100`}>
            <Text style={tw`text-gray-700`}>Emergency Contacts</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => showComingSoon('Support & Help')} style={tw`flex-row justify-between items-center py-3`}>
            <Text style={tw`text-gray-700`}>Support & Help</Text>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Publish Ride CTA */}
        <TouchableOpacity
          style={tw`w-full bg-[#16a34a] py-4 rounded-xl flex-row justify-center items-center mb-3 shadow-sm`}
          onPress={() => router.push('/(employee)/create')}
          accessibilityRole="button"
          accessibilityLabel="Publish a ride"
        >
          <Ionicons name="add-circle-outline" size={20} color="white" style={tw`mr-2`} />
          <Text style={tw`text-white font-bold text-base`}>Publish a Ride</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tw`w-full bg-red-50 py-4 rounded-xl flex-row justify-center items-center border border-red-100 ${loggingOut ? 'opacity-60' : ''}`}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel={loggingOut ? 'Signing out' : 'Sign out'}
        >
          {loggingOut
            ? <ActivityIndicator size="small" color="#dc2626" style={tw`mr-2`} />
            : <Ionicons name="log-out-outline" size={20} color="#dc2626" style={tw`mr-2`} />}
          <Text style={tw`text-red-600 font-bold text-base`}>{loggingOut ? 'Signing out…' : 'Sign Out'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
