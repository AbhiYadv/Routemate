import { View, Text, TouchableOpacity, SafeAreaView, Platform, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../src/components/Logo';

// Platform-aware shadow — avoids RN Web shadow* deprecation warnings
const cardShadow = Platform.select({
  web: { boxShadow: '0 1px 4px rgba(15,23,42,0.07)' } as any,
  default: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
});
const ctaShadow = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(29,78,216,0.35)' } as any,
  default: { shadowColor: '#1d4ed8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 6 },
});

const TRUST_PILLARS = [
  { icon: 'shield-checkmark-outline' as const, color: '#16a34a', text: 'Verified coworkers only' },
  { icon: 'map-outline' as const, color: '#16a34a', text: 'See live routes before booking' },
  { icon: 'people-outline' as const, color: '#16a34a', text: 'Know your co-travellers in advance' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#f0fdf4] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`flex-1 justify-between px-8 py-10`}>

        {/* Hero */}
        <View style={tw`items-center mt-6`}>
          <View style={tw`mb-7`}>
            <Logo size="large" />
          </View>

          <Text style={tw`text-[38px] font-extrabold text-[#0F172A] mb-2 text-center tracking-tight`}>
            RouteMate
          </Text>

          <Text style={tw`text-lg font-semibold text-[#16a34a] mb-8 text-center`}>
            Your trusted commute network
          </Text>

          {/* Trust pillars */}
          <View style={tw`w-full gap-3`}>
            {TRUST_PILLARS.map((item, i) => (
              <View
                key={i}
                style={[tw`flex-row items-center bg-white rounded-2xl px-4 py-3.5 border border-gray-100`, cardShadow]}
              >
                <View
                  style={{
                    ...tw`w-9 h-9 rounded-full items-center justify-center mr-3`,
                    backgroundColor: `${item.color}18`,
                  }}
                >
                  <Ionicons name={item.icon} size={18} color={item.color} />
                </View>
                <Text style={tw`text-[#0F172A] font-medium text-sm flex-1`}>{item.text}</Text>
                <Ionicons name="checkmark" size={14} color="#22C55E" />
              </View>
            ))}
          </View>
        </View>

        {/* CTA */}
        <View style={tw`gap-3`}>
          <TouchableOpacity
            style={[tw`w-full rounded-2xl py-4 flex-row justify-center items-center`, { backgroundColor: '#1d4ed8' }, ctaShadow]}
            onPress={() => router.push('/login')}
            accessibilityRole="button"
            accessibilityLabel="Get started"
          >
            <Text style={tw`text-white font-bold text-lg mr-2`}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>

          <Text style={tw`text-xs text-gray-400 text-center font-medium`}>
            Safe, smart corporate commuting
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}
