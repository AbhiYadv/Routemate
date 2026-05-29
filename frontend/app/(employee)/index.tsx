import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, TextInput, Modal, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { useAuthStore } from '../../src/store/auth';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import Logo from '../../src/components/Logo';
import { LOCATIONS } from '../../src/utils/locations';

export default function EmployeeHome() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [source, setSource] = useState(user?.home_area || 'BTM Layout');
  const [destination, setDestination] = useState('Whitefield Tech Park');
  const [date, setDate] = useState('Today, 8:30 AM');
  const [passengers, setPassengers] = useState('1');

  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [locationFieldType, setLocationFieldType] = useState<'source' | 'destination'>('source');
  const [searchQuery, setSearchQuery] = useState('');

  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.5);
  const carTranslateY = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    pulseOpacity.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    carTranslateY.value = withRepeat(withSequence(withTiming(-4, { duration: 1000 }), withTiming(0, { duration: 1000 })), -1, true);
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulseScale.value }], opacity: pulseOpacity.value }));
  const carStyle = useAnimatedStyle(() => ({ transform: [{ translateY: carTranslateY.value }] }));

  const handleSearch = () => {
    router.push({ pathname: '/(employee)/search', params: { source, destination, date, passengers } });
  };

  const openLocationSearch = (type: 'source' | 'destination') => {
    setLocationFieldType(type);
    setSearchQuery('');
    setLocationModalVisible(true);
  };

  const selectLocation = (name: string) => {
    if (locationFieldType === 'source') setSource(name);
    else setDestination(name);
    setLocationModalVisible(false);
  };

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} is currently under development.`);
  };

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'Are you sure you want to trigger an SOS alert? This will notify company security and admins immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Trigger SOS', style: 'destructive', onPress: () => Alert.alert('SOS Triggered', 'Security has been notified and live tracking is shared.') }
      ]
    );
  };

  const filteredLocations = LOCATIONS.filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <ScrollView contentContainerStyle={tw`flex-grow pb-8`}>
        <View style={tw`bg-white px-6 pt-4 pb-4 flex-row justify-between items-center shadow-sm z-10`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`mr-3`}>
              <Logo size="small" />
            </View>
            <View>
              <Text style={tw`text-gray-500 text-xs font-medium`}>Good morning,</Text>
              <Text style={tw`text-[#0F172A] text-lg font-bold`}>{user?.name}</Text>
            </View>
          </View>
          <View style={tw`flex-row items-center`}>
            <TouchableOpacity style={tw`mr-4 relative`} onPress={() => showComingSoon('Notifications')}>
              <Ionicons name="notifications-outline" size={24} color="#0F172A" />
              <View style={tw`absolute -top-1 -right-1 bg-red-500 w-3 h-3 rounded-full border-2 border-white`} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(employee)/profile')} style={tw`bg-[#F8FAFC] p-2 rounded-full border border-gray-100`}>
              <Ionicons name="person" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`bg-[#22C55E] px-6 py-10 rounded-b-3xl items-center relative overflow-hidden shadow-sm`}>
          <View style={tw`absolute inset-0 opacity-10 bg-black`} />
          <View style={tw`h-32 justify-center items-center relative w-full mb-2`}>
            <Animated.View style={[tw`absolute w-24 h-24 bg-green-100 rounded-full`, pulseStyle]} />
            <Animated.View style={[tw`absolute w-16 h-16 bg-green-200 rounded-full opacity-50`]} />
            <Animated.View style={[tw`bg-white w-16 h-16 rounded-full items-center justify-center shadow-lg`, carStyle]}>
              <Ionicons name="car-sport" size={36} color="#22C55E" />
            </Animated.View>
          </View>
          <Text style={tw`text-white text-2xl font-extrabold mb-1 text-center`}>Find trusted rides to work.</Text>
          <Text style={tw`text-green-50 text-sm text-center font-medium`}>See who's going your way before you book.</Text>
        </View>

        <View style={tw`px-4 -mt-6`}>
          <View style={tw`bg-white rounded-2xl p-5 shadow-md border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`items-center mr-3`}>
                <View style={tw`w-3 h-3 rounded-full bg-[#2563EB]`} />
                <View style={tw`w-0.5 h-8 bg-gray-200 my-1`} />
                <View style={tw`w-3 h-3 rounded-full bg-[#22C55E]`} />
              </View>
              <View style={tw`flex-1`}>
                <TouchableOpacity onPress={() => openLocationSearch('source')} style={tw`border-b border-gray-100 py-3 mb-2`}>
                  <Text style={tw`${source ? 'text-[#0F172A]' : 'text-[#94a3b8]'} text-base font-medium`}>{source || 'Leaving from'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openLocationSearch('destination')} style={tw`border-b border-gray-100 py-3`}>
                  <Text style={tw`${destination ? 'text-[#0F172A]' : 'text-[#94a3b8]'} text-base font-medium`}>{destination || 'Going to'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`flex-row justify-between mb-5`}>
              <View style={tw`flex-row items-center border-b border-gray-100 py-2 flex-1 mr-4`}>
                <Ionicons name="time-outline" size={18} color="#64748b" style={tw`mr-2`} />
                <TextInput style={tw`text-[#0F172A] flex-1 font-medium`} value={date} onChangeText={setDate} />
              </View>
              <View style={tw`flex-row items-center border-b border-gray-100 py-2 w-20`}>
                <Ionicons name="people-outline" size={18} color="#64748b" style={tw`mr-2`} />
                <TextInput style={tw`text-[#0F172A] flex-1 font-medium`} value={passengers} keyboardType="number-pad" onChangeText={setPassengers} />
              </View>
            </View>

            <TouchableOpacity onPress={handleSearch} style={tw`bg-[#2563EB] py-4 rounded-xl flex-row justify-center items-center shadow-sm`}>
              <Text style={tw`text-white font-bold text-lg mr-2`}>Search Rides</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`px-6 mt-8`}>
          <Text style={tw`text-[#0F172A] font-extrabold text-lg mb-4`}>Explore</Text>
          <View style={tw`flex-row justify-between flex-wrap gap-y-4`}>
            <TouchableOpacity style={tw`bg-white w-[31%] rounded-xl p-4 items-center shadow-sm border border-gray-100`} onPress={() => router.push('/(employee)/create')}>
              <View style={tw`bg-orange-50 w-12 h-12 rounded-full items-center justify-center mb-3`}><Ionicons name="add" size={24} color="#ea580c" /></View>
              <Text style={tw`text-sm text-[#0F172A] font-bold`}>Publish</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`bg-white w-[31%] rounded-xl p-4 items-center shadow-sm border border-gray-100`} onPress={() => router.push('/(employee)/map')}>
              <View style={tw`bg-green-50 w-12 h-12 rounded-full items-center justify-center mb-3`}><Ionicons name="map" size={24} color="#22C55E" /></View>
              <Text style={tw`text-sm text-[#0F172A] font-bold`}>Live Map</Text>
            </TouchableOpacity>
            <TouchableOpacity style={tw`bg-white w-[31%] rounded-xl p-4 items-center shadow-sm border border-red-50`} onPress={handleSOS}>
              <View style={tw`bg-red-50 w-12 h-12 rounded-full items-center justify-center mb-3`}><Ionicons name="shield-half" size={24} color="#dc2626" /></View>
              <Text style={tw`text-sm text-red-700 font-bold`}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={tw`px-6 mt-8`}>
          <Text style={tw`text-[#0F172A] font-extrabold text-lg mb-3`}>Your usual route</Text>
          <View style={tw`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex-row items-center justify-between`}>
            <View>
              <Text style={tw`text-[#0F172A] font-bold`}>BTM Layout → Whitefield</Text>
              <Text style={tw`text-gray-500 text-sm mt-1 font-medium`}>Usually around 8:30 AM</Text>
            </View>
            <TouchableOpacity onPress={handleSearch} style={tw`bg-[#F8FAFC] px-4 py-2 rounded-lg border border-gray-100`}>
              <Text style={tw`text-[#2563EB] font-bold`}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <Modal visible={isLocationModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={tw`flex-1 bg-white pt-${Platform.OS === 'android' ? '8' : '0'}`}>
          <View style={tw`px-4 py-4 flex-row items-center border-b border-gray-100`}>
            <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={tw`mr-3 p-2`}>
              <Ionicons name="close" size={28} color="#0F172A" />
            </TouchableOpacity>
            <TextInput 
              style={tw`flex-1 bg-[#F8FAFC] border border-gray-200 rounded-xl px-4 py-3 text-base text-[#0F172A] font-medium`}
              placeholder={locationFieldType === 'source' ? "Where from?" : "Where to?"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
          </View>
          <ScrollView contentContainerStyle={tw`p-4`}>
            <Text style={tw`text-gray-500 font-bold mb-4 ml-2`}>Suggested Locations</Text>
            {filteredLocations.map((loc, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={tw`flex-row items-center p-3 mb-2 border-b border-gray-50`}
                onPress={() => selectLocation(loc.name)}
              >
                <View style={tw`bg-gray-100 w-10 h-10 rounded-full items-center justify-center mr-4`}>
                  <Ionicons name="location" size={20} color="#64748b" />
                </View>
                <View>
                  <Text style={tw`text-lg font-bold text-[#0F172A]`}>{loc.name}</Text>
                  <Text style={tw`text-gray-500 text-sm`}>Bangalore, Karnataka</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
