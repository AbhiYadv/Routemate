import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { useAuthStore } from '../../src/store/auth';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';

export default function EmployeeHome() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [source, setSource] = useState(user?.home_area || '');
  const [destination, setDestination] = useState('Whitefield Tech Park');
  const [date, setDate] = useState('Today, 8:30 AM');
  const [passengers, setPassengers] = useState('1');

  // Animation values for the car hero
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const carTranslateY = useSharedValue(0);

  useEffect(() => {
    // Pulse animation
    pulseScale.value = withRepeat(
      withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
    
    // Subtle car hover
    carTranslateY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const carStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: carTranslateY.value }],
  }));

  const handleSearch = () => {
    router.push({
      pathname: '/(employee)/search',
      params: { source, destination, date, passengers }
    });
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <ScrollView contentContainerStyle={tw`flex-grow pb-8`}>
        {/* Header */}
        <View style={tw`bg-white px-6 pt-4 pb-4 flex-row justify-between items-center shadow-sm z-10`}>
          <View>
            <Text style={tw`text-gray-500 text-sm font-medium`}>Good morning,</Text>
            <Text style={tw`text-gray-900 text-xl font-bold`}>{user?.name}</Text>
          </View>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity style={tw`mr-4 relative`}>
              <Ionicons name="notifications-outline" size={24} color="#374151" />
              <View style={tw`absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white`} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(employee)/profile')} style={tw`bg-green-100 p-2 rounded-full`}>
              <Ionicons name="person" size={20} color="#16a34a" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Animated Hero Section */}
        <View style={tw`bg-green-600 px-6 py-10 rounded-b-3xl items-center relative overflow-hidden`}>
          <View style={tw`absolute inset-0 opacity-10`}>
             {/* Background map pattern simulation */}
          </View>
          
          <View style={tw`h-32 justify-center items-center relative w-full mb-2`}>
            {/* Pulsing ring */}
            <Animated.View style={[tw`absolute w-24 h-24 bg-green-300 rounded-full`, pulseStyle]} />
            <Animated.View style={[tw`absolute w-16 h-16 bg-green-400 rounded-full opacity-50`]} />
            {/* Car Icon */}
            <Animated.View style={[tw`bg-white w-16 h-16 rounded-full items-center justify-center shadow-lg`, carStyle]}>
              <Ionicons name="car-sport" size={36} color="#16a34a" />
            </Animated.View>
          </View>

          <Text style={tw`text-white text-2xl font-bold mb-1 text-center`}>Your commute network is live</Text>
          <Text style={tw`text-green-100 text-sm text-center`}>Find verified poolers and rides near you</Text>
        </View>

        {/* Route Search Form (Floating) */}
        <View style={tw`px-4 -mt-6`}>
          <View style={tw`bg-white rounded-2xl p-5 shadow-md border border-gray-100`}>
            
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`items-center mr-3`}>
                <View style={tw`w-3 h-3 rounded-full bg-blue-500`} />
                <View style={tw`w-0.5 h-8 bg-gray-200 my-1`} />
                <View style={tw`w-3 h-3 rounded-full bg-green-500`} />
              </View>
              <View style={tw`flex-1`}>
                <TextInput 
                  style={tw`border-b border-gray-200 py-2 text-base text-gray-900 mb-2`}
                  placeholder="Leaving from"
                  value={source}
                  onChangeText={setSource}
                />
                <TextInput 
                  style={tw`border-b border-gray-200 py-2 text-base text-gray-900`}
                  placeholder="Going to"
                  value={destination}
                  onChangeText={setDestination}
                />
              </View>
            </View>

            <View style={tw`flex-row justify-between mb-5`}>
              <View style={tw`flex-row items-center border-b border-gray-200 py-2 flex-1 mr-4`}>
                <Ionicons name="time-outline" size={18} color="#6b7280" style={tw`mr-2`} />
                <TextInput 
                  style={tw`text-gray-900 flex-1`}
                  value={date}
                  onChangeText={setDate}
                />
              </View>
              <View style={tw`flex-row items-center border-b border-gray-200 py-2 w-20`}>
                <Ionicons name="people-outline" size={18} color="#6b7280" style={tw`mr-2`} />
                <TextInput 
                  style={tw`text-gray-900 flex-1`}
                  value={passengers}
                  keyboardType="number-pad"
                  onChangeText={setPassengers}
                />
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleSearch}
              style={tw`bg-gray-900 py-4 rounded-xl flex-row justify-center items-center shadow-sm`}
            >
              <Text style={tw`text-white font-bold text-lg mr-2`}>Search Rides</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>

          </View>
        </View>

        {/* Quick Actions */}
        <View style={tw`px-6 mt-6`}>
          <Text style={tw`text-gray-900 font-bold text-lg mb-4`}>Explore</Text>
          <View style={tw`flex-row justify-between flex-wrap gap-y-4`}>
            <TouchableOpacity 
              style={tw`bg-white w-[48%] rounded-xl p-4 items-center shadow-sm border border-gray-100`}
              onPress={handleSearch}
            >
              <View style={tw`bg-blue-50 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="search" size={24} color="#0284c7" />
              </View>
              <Text style={tw`text-sm text-gray-800 font-semibold`}>Find Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`bg-white w-[48%] rounded-xl p-4 items-center shadow-sm border border-gray-100`}
              onPress={() => router.push('/(employee)/map')}
            >
              <View style={tw`bg-green-50 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="map" size={24} color="#16a34a" />
              </View>
              <Text style={tw`text-sm text-gray-800 font-semibold`}>Live Map</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`bg-white w-[48%] rounded-xl p-4 items-center shadow-sm border border-gray-100`}
              onPress={() => alert('AI Assistant coming soon')}
            >
              <View style={tw`bg-purple-50 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="sparkles" size={24} color="#9333ea" />
              </View>
              <Text style={tw`text-sm text-gray-800 font-semibold`}>AI Assistant</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={tw`bg-white w-[48%] rounded-xl p-4 items-center shadow-sm border border-red-50`}
              onPress={() => alert('SOS Help initiated')}
            >
              <View style={tw`bg-red-50 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="shield-half" size={24} color="#dc2626" />
              </View>
              <Text style={tw`text-sm text-red-700 font-bold`}>SOS / Help</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Usual Route & Nearby Poolers */}
        <View style={tw`px-6 mt-8`}>
          <Text style={tw`text-gray-900 font-bold text-lg mb-3`}>Your usual route</Text>
          <View style={tw`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-gray-800 font-semibold`}>BTM Layout → Whitefield</Text>
              <Text style={tw`text-gray-500 text-sm mt-1`}>Usually around 8:30 AM</Text>
            </View>
            <TouchableOpacity onPress={handleSearch} style={tw`bg-gray-100 px-3 py-2 rounded-lg`}>
              <Text style={tw`text-gray-800 font-semibold`}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
