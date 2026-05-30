import { View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform, ScrollView, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../src/utils/api';
import MapComponent from '../../src/components/MapComponent';

export default function LiveMap() {
  const router = useRouter();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'rides' | 'poolers'>('rides');
  const [rides, setRides] = useState<any[]>([]);
  const [poolers, setPoolers] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Location is off. You can still search rides manually.');
        setLoading(false);
        return;
      }

      try {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        await api.post('/location/update', { latitude: loc.coords.latitude, longitude: loc.coords.longitude });

        const [ridesRes, poolersRes] = await Promise.all([
          api.get('/rides/search', { params: { source: '', destination: '', passengers: 1 } }),
          api.get(`/poolers/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`)
        ]);

        setRides(ridesRes.data || []);
        setPoolers(poolersRes.data || []);
      } catch (err) {
        console.log(err);
      }
      setLoading(false);
    })();
  }, []);

  const handleRecenter = async () => {
    if (!location) return;
    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-[#F8FAFC]`}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={tw`mt-4 text-gray-600 font-bold`}>Finding live network...</Text>
      </View>
    );
  }

  let markers: any[] = [];
  if (activeTab === 'rides') {
    rides.forEach(r => {
      if (r.origin_latitude && r.origin_longitude) {
        markers.push({ id: `ride_${r.id}`, latitude: r.origin_latitude, longitude: r.origin_longitude, type: 'ride', title: r.driver_name, subtitle: `${r.available_seats} seats` });
      }
    });
  } else {
    poolers.forEach(p => {
      if (p.current_latitude && p.current_longitude) {
        markers.push({ id: `pooler_${p.user_id}`, latitude: p.current_latitude, longitude: p.current_longitude, type: 'pooler', title: p.name, subtitle: `${p.rating} Trust` });
      }
    });
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      
      {/* Top Navigation Row */}
      <View style={tw`absolute top-10 w-full px-4 flex-row items-center z-10 justify-between`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`bg-white w-10 h-10 rounded-full shadow-md items-center justify-center`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        
        {/* Toggle Pill */}
        <View style={tw`bg-white rounded-full flex-row p-1 shadow-md border border-gray-100`}>
          <TouchableOpacity 
            onPress={() => setActiveTab('rides')}
            style={tw`px-6 py-2 rounded-full ${activeTab === 'rides' ? 'bg-[#0F172A]' : 'bg-transparent'}`}
          >
            <Text style={tw`font-bold ${activeTab === 'rides' ? 'text-white' : 'text-gray-500'}`}>Rides</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('poolers')}
            style={tw`px-6 py-2 rounded-full ${activeTab === 'poolers' ? 'bg-[#0F172A]' : 'bg-transparent'}`}
          >
            <Text style={tw`font-bold ${activeTab === 'poolers' ? 'text-white' : 'text-gray-500'}`}>Poolers</Text>
          </TouchableOpacity>
        </View>
        <View style={tw`w-10`} />
      </View>

      {errorMsg ? (
        <View style={tw`flex-1 justify-center items-center p-6 bg-gray-50`}>
          <Ionicons name="location-outline" size={48} color="#9ca3af" />
          <Text style={tw`text-gray-600 text-center mt-4 font-bold text-lg`}>{errorMsg}</Text>
          <TouchableOpacity style={tw`mt-6 bg-[#2563EB] px-8 py-4 rounded-xl shadow-sm`} onPress={() => router.push('/(employee)')}>
            <Text style={tw`text-white font-bold`}>Go to Manual Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={tw`flex-1 relative`}>
          <MapComponent userLocation={location?.coords} markers={markers} />
          
          <TouchableOpacity onPress={handleRecenter} style={tw`absolute bottom-[40%] right-4 bg-white w-12 h-12 rounded-full shadow-lg items-center justify-center z-10`}>
            <Ionicons name="locate" size={24} color="#2563EB" />
          </TouchableOpacity>

          {/* Bottom Sheet Data */}
          <View style={tw`absolute bottom-0 left-0 right-0 bg-[#F8FAFC] rounded-t-3xl shadow-xl h-[38%] pt-4 border-t border-gray-100 z-10`}>
            <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4`} />
            <Text style={tw`text-[#0F172A] font-extrabold text-lg mb-3 px-6`}>
              {activeTab === 'rides' ? 'Live Rides Nearby' : 'Active Poolers Nearby'}
            </Text>
            
            <ScrollView contentContainerStyle={tw`px-4 pb-8`}>
              {activeTab === 'rides' ? (
                rides.length === 0 ? <Text style={tw`text-center text-gray-500 mt-4`}>No live rides found.</Text> :
                rides.map((r, i) => (
                  <View key={i} style={tw`bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center justify-between`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-bold text-[#0F172A] text-lg`}>{r.driver_name}</Text>
                      <Text style={tw`text-gray-500 text-xs mt-0.5`}>{r.origin_area} → {r.destination_area}</Text>
                      <Text style={tw`text-[#22C55E] text-xs font-bold mt-1`}>{r.available_seats} seats left</Text>
                    </View>
                    <TouchableOpacity style={tw`bg-[#0F172A] px-4 py-2 rounded-lg`} onPress={() => router.push(`/(employee)/ride/${r.id}`)}>
                      <Text style={tw`text-white font-bold text-xs`}>View</Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                poolers.length === 0 ? <Text style={tw`text-center text-gray-500 mt-4`}>No poolers found.</Text> :
                poolers.map((p, i) => (
                  <View key={i} style={tw`bg-white p-4 rounded-2xl shadow-sm mb-3 border border-gray-100 flex-row items-center justify-between`}>
                    <View style={tw`w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3`}>
                      <Ionicons name="person" size={24} color="#64748b" />
                    </View>
                    <View style={tw`flex-1`}>
                      <Text style={tw`font-bold text-[#0F172A] text-lg`}>{p.name}</Text>
                      <View style={tw`flex-row items-center mt-0.5`}>
                         <Ionicons name="star" size={12} color="#fbbf24" style={tw`mr-1`} />
                         <Text style={tw`text-gray-600 text-xs font-bold`}>{p.rating} • {p.trust_score} Trust</Text>
                      </View>
                    </View>
                    <View style={tw`flex-row gap-2`}>
                      <TouchableOpacity style={tw`bg-blue-50 w-8 h-8 rounded-full items-center justify-center border border-blue-100`} onPress={() => Alert.alert('Coming Soon', 'Messaging from the map is coming soon.')}>
                        <Ionicons name="chatbubble" size={14} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity style={tw`bg-[#0F172A] px-4 py-2 rounded-lg justify-center`} onPress={() => router.push(`/(employee)/pooler/${p.user_id}`)}>
                        <Text style={tw`text-white font-bold text-xs`}>Profile</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
