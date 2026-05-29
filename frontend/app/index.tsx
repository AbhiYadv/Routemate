import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

export default function LandingPage() {
  const router = useRouter();

  return (
    <SafeAreaView style={tw`flex-1 bg-white pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        <View style={tw`px-6 py-8 items-center`}>
          <View style={tw`w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-6`}>
            <Ionicons name="car" size={40} color="#0284c7" />
          </View>
          <Text style={tw`text-3xl font-bold text-gray-900 text-center mb-4`}>
            Corporate Commute Connect
          </Text>
          <Text style={tw`text-base text-gray-500 text-center mb-8 px-4`}>
            A verified corporate commute platform. Discover, book, and share trusted rides with your coworkers.
          </Text>

          <TouchableOpacity 
            style={tw`w-full bg-blue-600 rounded-xl py-4 flex-row justify-center items-center shadow-sm`}
            onPress={() => router.push('/login')}
          >
            <Text style={tw`text-white font-bold text-lg mr-2`}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>

        <View style={tw`px-6 py-8 bg-gray-50 mt-auto`}>
          <Text style={tw`text-xl font-bold text-gray-900 mb-6`}>Why choose us?</Text>
          
          <View style={tw`flex-row mb-6`}>
            <View style={tw`w-12 h-12 bg-green-100 rounded-full items-center justify-center mr-4`}>
              <Ionicons name="shield-checkmark" size={24} color="#16a34a" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>Verified & Safe</Text>
              <Text style={tw`text-gray-500 mt-1`}>Commute exclusively with verified colleagues and trusted company shuttles.</Text>
            </View>
          </View>

          <View style={tw`flex-row mb-6`}>
            <View style={tw`w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-4`}>
              <Ionicons name="leaf" size={24} color="#9333ea" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>Eco-Friendly</Text>
              <Text style={tw`text-gray-500 mt-1`}>Reduce carbon footprint by maximizing seat utilization and carpooling.</Text>
            </View>
          </View>

          <View style={tw`flex-row mb-6`}>
            <View style={tw`w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4`}>
              <Ionicons name="wallet" size={24} color="#ea580c" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-lg font-bold text-gray-900`}>Save Money</Text>
              <Text style={tw`text-gray-500 mt-1`}>Share costs and reduce corporate transport overheads effectively.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
