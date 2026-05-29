import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';

export default function SearchResults() {
  const router = useRouter();
  const params = useLocalSearchParams();

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View>
          <Text style={tw`text-gray-900 font-bold text-lg`}>Available Rides</Text>
          <Text style={tw`text-gray-500 text-sm`}>
            {params.source || 'BTM'} to {params.destination || 'Whitefield'}
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={tw`p-4`}>
        <Text style={tw`text-center text-gray-500 my-10`}>Milestone 2 will show detailed ride match cards here.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
