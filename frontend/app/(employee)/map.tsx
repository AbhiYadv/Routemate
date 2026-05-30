import {
  View, Text, SafeAreaView, TouchableOpacity, ActivityIndicator,
  Platform, FlatList, Alert,
} from 'react-native';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../src/utils/api';
import MapComponent from '../../src/components/MapComponent';

const MAX_MARKERS = 8;

// Compact card for bottom sheet
function RideCompactCard({ ride, onPress }: { ride: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={tw`bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row items-center`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ride by ${ride.driver_name}`}
    >
      <View style={tw`w-10 h-10 bg-green-50 rounded-full items-center justify-center mr-3 border border-green-100`}>
        <Ionicons name="car-outline" size={18} color="#22C55E" />
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`font-bold text-[#0F172A] text-sm`} numberOfLines={1}>
          {ride.driver_name || 'Driver'}
        </Text>
        <Text style={tw`text-gray-400 text-xs mt-0.5`} numberOfLines={1}>
          {ride.origin_area} → {ride.destination_area}
        </Text>
      </View>
      <View style={tw`items-end ml-2`}>
        <Text style={tw`text-[#22C55E] text-xs font-bold`}>{ride.available_seats} seats</Text>
        <Text style={tw`text-gray-400 text-[10px] mt-0.5`}>
          {ride.departure_time
            ? new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function PoolerCompactCard({ pooler, onPress }: { pooler: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={tw`bg-white p-4 rounded-2xl mb-3 border border-gray-100 flex-row items-center`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View pooler ${pooler.name}`}
    >
      <View style={tw`w-10 h-10 bg-purple-50 rounded-full items-center justify-center mr-3 border border-purple-100`}>
        <Ionicons name="person-outline" size={18} color="#9333ea" />
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`font-bold text-[#0F172A] text-sm`} numberOfLines={1}>{pooler.name || 'Pooler'}</Text>
        <Text style={tw`text-gray-400 text-xs mt-0.5`} numberOfLines={1}>
          {pooler.usual_origin_area} → {pooler.usual_destination_area}
        </Text>
      </View>
      <View style={tw`items-center ml-2`}>
        <Ionicons name="star" size={12} color="#fbbf24" />
        <Text style={tw`text-gray-600 text-[10px] font-bold mt-0.5`}>{pooler.rating}</Text>
      </View>
    </TouchableOpacity>
  );
}

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
        setErrorMsg('Location permission not granted. You can still search rides manually.');
        setLoading(false);
        return;
      }
      try {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
        await api.post('/location/update', {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        const [ridesRes, poolersRes] = await Promise.all([
          api.get('/rides/search', { params: { source: '', destination: '', passengers: 1 } }),
          api.get(`/poolers/nearby?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`),
        ]);
        setRides(ridesRes.data || []);
        setPoolers(poolersRes.data || []);
      } catch {
        // Location or API failed — show fallback
        setErrorMsg('Could not load live network. Check your connection.');
      }
      setLoading(false);
    })();
  }, []);

  // Limit to MAX_MARKERS to keep map clean
  const visibleRides = useMemo(() =>
    rides.filter((r) => r.origin_latitude && r.origin_longitude).slice(0, MAX_MARKERS),
    [rides]
  );
  const visiblePoolers = useMemo(() =>
    poolers.filter((p) => p.current_latitude && p.current_longitude).slice(0, MAX_MARKERS),
    [poolers]
  );

  const markers = useMemo(() => {
    if (activeTab === 'rides') {
      return visibleRides.map((r) => ({
        id: `ride_${r.id}`,
        latitude: r.origin_latitude,
        longitude: r.origin_longitude,
        type: 'ride',
        title: r.driver_name,
        subtitle: `${r.available_seats} seats`,
      }));
    }
    return visiblePoolers.map((p) => ({
      id: `pooler_${p.user_id}`,
      latitude: p.current_latitude,
      longitude: p.current_longitude,
      type: 'pooler',
      title: p.name,
      subtitle: p.trust_score,
    }));
  }, [activeTab, visibleRides, visiblePoolers]);

  const hiddenRideCount = rides.length - visibleRides.length;
  const hiddenPoolerCount = poolers.length - visiblePoolers.length;

  if (loading) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#F8FAFC]`}>
        <ActivityIndicator size="large" color="#1d4ed8" />
        <Text style={tw`mt-4 text-gray-500 font-medium`}>Finding live network…</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg) {
    return (
      <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#F8FAFC] px-8`}>
        <View style={tw`w-20 h-20 bg-green-50 rounded-full items-center justify-center mb-6`}>
          <Ionicons name="map-outline" size={40} color="#1d4ed8" />
        </View>
        <Text style={tw`text-[#0F172A] font-bold text-xl text-center mb-3`}>Map unavailable</Text>
        <Text style={tw`text-gray-500 text-sm text-center mb-8 leading-relaxed`}>{errorMsg}</Text>
        <TouchableOpacity
          style={tw`bg-[#1d4ed8] px-8 py-4 rounded-xl shadow-sm`}
          onPress={() => router.push('/(employee)')}
          accessibilityRole="button"
          accessibilityLabel="Search rides manually"
        >
          <Text style={tw`text-white font-bold`}>Search Rides</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>

      {/* Rides / Poolers toggle — floats above map */}
      <View style={tw`absolute top-12 left-0 right-0 flex-row justify-center z-10`}>
        <View style={tw`bg-white rounded-full flex-row p-1 shadow-md border border-gray-100`}>
          <TouchableOpacity
            onPress={() => setActiveTab('rides')}
            style={tw`px-5 py-2 rounded-full ${activeTab === 'rides' ? 'bg-[#0F172A]' : 'bg-transparent'}`}
            accessibilityRole="tab"
            accessibilityLabel="Rides tab"
            accessibilityState={{ selected: activeTab === 'rides' }}
          >
            <Text style={tw`font-bold text-sm ${activeTab === 'rides' ? 'text-white' : 'text-gray-500'}`}>
              Rides{rides.length > 0 ? ` (${rides.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('poolers')}
            style={tw`px-5 py-2 rounded-full ${activeTab === 'poolers' ? 'bg-[#0F172A]' : 'bg-transparent'}`}
            accessibilityRole="tab"
            accessibilityLabel="Poolers tab"
            accessibilityState={{ selected: activeTab === 'poolers' }}
          >
            <Text style={tw`font-bold text-sm ${activeTab === 'poolers' ? 'text-white' : 'text-gray-500'}`}>
              Poolers{poolers.length > 0 ? ` (${poolers.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={tw`flex-1 relative`}>
        {/* Map — takes full height behind bottom sheet */}
        <MapComponent
          userLocation={location?.coords}
          markers={markers}
        />

        {/* Recenter */}
        <TouchableOpacity
          onPress={async () => {
            if (!location) return;
            const loc = await Location.getCurrentPositionAsync({});
            setLocation(loc);
          }}
          style={tw`absolute bottom-[42%] right-4 bg-white w-12 h-12 rounded-full shadow-lg items-center justify-center z-10 border border-gray-100`}
          accessibilityRole="button"
          accessibilityLabel="Recenter map"
        >
          <Ionicons name="locate-outline" size={22} color="#1d4ed8" />
        </TouchableOpacity>

        {/* Bottom sheet */}
        <View style={tw`absolute bottom-0 left-0 right-0 bg-[#F8FAFC] rounded-t-3xl shadow-xl h-[40%] pt-3 border-t border-gray-100 z-10`}>
          <View style={tw`w-10 h-1 bg-gray-300 rounded-full self-center mb-3`} />

          <View style={tw`flex-row items-center justify-between px-5 mb-3`}>
            <Text style={tw`text-[#0F172A] font-bold text-base`}>
              {activeTab === 'rides' ? 'Rides Nearby' : 'Active Poolers'}
            </Text>
            {((activeTab === 'rides' && hiddenRideCount > 0) || (activeTab === 'poolers' && hiddenPoolerCount > 0)) && (
              <View style={tw`bg-gray-100 px-2 py-1 rounded-full`}>
                <Text style={tw`text-gray-500 text-xs font-semibold`}>
                  +{activeTab === 'rides' ? hiddenRideCount : hiddenPoolerCount} more
                </Text>
              </View>
            )}
          </View>

          {activeTab === 'rides' ? (
            rides.length === 0 ? (
              <View style={tw`items-center mt-4`}>
                <Ionicons name="car-outline" size={32} color="#94a3b8" />
                <Text style={tw`text-gray-400 text-sm mt-2`}>No live rides right now.</Text>
              </View>
            ) : (
              <FlatList
                data={visibleRides}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RideCompactCard
                    ride={item}
                    onPress={() => router.push(`/(employee)/ride/${item.id}`)}
                  />
                )}
                contentContainerStyle={tw`px-4 pb-6`}
                showsVerticalScrollIndicator={false}
              />
            )
          ) : (
            poolers.length === 0 ? (
              <View style={tw`items-center mt-4`}>
                <Ionicons name="people-outline" size={32} color="#94a3b8" />
                <Text style={tw`text-gray-400 text-sm mt-2`}>No poolers found nearby.</Text>
              </View>
            ) : (
              <FlatList
                data={visiblePoolers}
                keyExtractor={(item) => item.user_id}
                renderItem={({ item }) => (
                  <PoolerCompactCard
                    pooler={item}
                    onPress={() => router.push(`/(employee)/pooler/${item.user_id}`)}
                  />
                )}
                contentContainerStyle={tw`px-4 pb-6`}
                showsVerticalScrollIndicator={false}
              />
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
