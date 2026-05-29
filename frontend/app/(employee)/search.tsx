import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../src/utils/api';
import MapComponent from '../../src/components/MapComponent';

export default function SearchResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/rides/search', {
          params: {
            source: params.source,
            destination: params.destination,
            passengers: params.passengers || 1
          }
        });
        setRides(data || []);
      } catch (err) {
        console.log("Search error", err);
        setRides([]);
      }
      setLoading(false);
    })();
  }, [params]);

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      {/* Map Background Placeholder */}
      <View style={tw`absolute inset-0 bg-gray-200 items-center justify-center`}>
         <MapComponent />
      </View>

      <View style={tw`absolute top-10 w-full px-4 flex-row items-center z-10`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`bg-white w-10 h-10 rounded-full shadow-md items-center justify-center mr-3`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={tw`flex-1 bg-white px-4 py-2 rounded-xl shadow-md flex-row items-center justify-between`}>
          <View>
             <Text style={tw`text-[#0F172A] font-bold text-base`}>{params.source || 'Anywhere'} → {params.destination || 'Work'}</Text>
             <Text style={tw`text-gray-500 text-xs`}>{params.date || 'Today'} • {params.passengers || 1} passenger(s)</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Style List */}
      <View style={tw`absolute bottom-0 w-full bg-[#F8FAFC] rounded-t-3xl shadow-xl h-[65%] pt-4`}>
        <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4`} />
        
        <View style={tw`px-6 mb-2`}>
          <Text style={tw`text-xl font-extrabold text-[#0F172A]`}>Available rides near your route</Text>
        </View>

        <ScrollView contentContainerStyle={tw`px-4 pb-8`}>
          {loading ? (
            <Text style={tw`text-center text-gray-500 mt-10`}>Finding routes...</Text>
          ) : (!rides || rides.length === 0) ? (
            <Text style={tw`text-center text-gray-500 mt-10`}>No exact matches found. Try adjusting your time or areas.</Text>
          ) : (
            rides.map((ride, idx) => (
              <TouchableOpacity 
                key={idx} 
                style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4`}
                onPress={() => router.push(`/(employee)/ride/${ride.id}`)}
              >
                <View style={tw`flex-row justify-between mb-3`}>
                  <View style={tw`flex-row items-center`}>
                    <View style={tw`w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden`}>
                      {ride.driver_avatar ? (
                         <View style={tw`w-full h-full bg-gray-200`} />
                      ) : (
                         <Ionicons name="person" size={24} color="#64748b" />
                      )}
                    </View>
                    <View>
                      <Text style={tw`text-lg font-bold text-[#0F172A]`}>{ride.driver_name || 'Pooler'}</Text>
                      <View style={tw`flex-row items-center mt-0.5`}>
                        <Ionicons name="shield-checkmark" size={14} color="#2563EB" style={tw`mr-1`} />
                        <Text style={tw`text-[#2563EB] text-xs font-semibold`}>{ride.visibility_badge}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={tw`items-end`}>
                    <Text style={tw`text-lg font-extrabold text-[#0F172A]`}>{ride.route_match_score || 0}% Match</Text>
                    <View style={tw`flex-row items-center mt-1`}>
                      <Ionicons name="star" size={12} color="#fbbf24" style={tw`mr-1`} />
                      <Text style={tw`text-gray-600 text-xs font-bold`}>{ride.driver_rating || '5.0'}</Text>
                    </View>
                  </View>
                </View>

                <View style={tw`bg-[#F8FAFC] rounded-xl p-3 mb-3 border border-gray-100`}>
                  <Text style={tw`text-[#0F172A] font-semibold text-sm`}>{ride.origin_area} → {ride.destination_area}</Text>
                  <View style={tw`flex-row items-center justify-between mt-2`}>
                    <Text style={tw`text-gray-600 text-xs`}>Leaves {ride.departure_time ? new Date(ride.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} • ETA {ride.estimated_arrival_time ? new Date(ride.estimated_arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</Text>
                    <View style={tw`bg-orange-100 px-2 py-0.5 rounded`}>
                      <Text style={tw`text-orange-700 text-xs font-bold`}>+{ride.detour_minutes || 0} min detour</Text>
                    </View>
                  </View>
                </View>

                <View style={tw`flex-row justify-between items-center`}>
                  <View style={tw`flex-row items-center`}>
                    <Ionicons name="people" size={16} color="#64748b" style={tw`mr-1.5`} />
                    <Text style={tw`text-gray-600 text-sm font-medium`}>{ride.current_passenger_count || 0} booked • <Text style={tw`text-[#22C55E] font-bold`}>{ride.available_seats || 0} seats left</Text></Text>
                  </View>
                  <TouchableOpacity 
                    style={tw`bg-[#0F172A] px-5 py-2 rounded-lg`}
                    onPress={() => router.push(`/(employee)/ride/${ride.id}`)}
                  >
                    <Text style={tw`text-white font-bold`}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
