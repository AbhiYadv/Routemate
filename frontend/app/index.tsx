import { View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import Logo from '../src/components/Logo';

export default function LandingPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`flex-1 justify-center items-center px-8`}>
        
        <View style={tw`mb-8 shadow-lg`}>
          <Logo size="large" />
        </View>
        
        <Text style={tw`text-4xl font-extrabold text-[#0F172A] mb-3`}>
          RouteMate
        </Text>
        
        <Text style={tw`text-xl font-bold text-[#2563EB] mb-6 text-center`}>
          Your trusted commute network.
        </Text>
        
        <Text style={tw`text-base text-gray-600 text-center mb-12 leading-relaxed`}>
          Find verified coworker rides, see live routes, check co-traveller stops, and reach work with confidence.
        </Text>

        <TouchableOpacity 
          style={tw`w-full bg-[#2563EB] rounded-2xl py-4 flex-row justify-center items-center shadow-md`}
          onPress={() => router.push('/login')}
        >
          <Text style={tw`text-white font-bold text-lg`}>Get Started</Text>
        </TouchableOpacity>

        <Text style={tw`text-sm text-gray-400 mt-8 text-center font-medium`}>
          Built for safe, smart corporate commuting.
        </Text>
      </View>
    </SafeAreaView>
  );
}
