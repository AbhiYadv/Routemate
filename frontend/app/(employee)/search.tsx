import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../src/utils/api';
import MapComponent from '../../src/components/MapComponent';
import { LOCATIONS } from '../../src/utils/locations';

export default function SearchResults() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [rides, setRides] = useState<any[]>([]);
  const [poolers, setPoolers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingRideId, setBookingRideId] = useState<string | null>(null);

  const sourceLoc = LOCATIONS.find(l => l.name === params.source);
  const destLoc = LOCATIONS.find(l => l.name === params.destination);

  const fetchData = async () => {
    try {
      const { data } = await api.get('/rides/search', {
        params: { source: params.source, destination: params.destination, passengers: params.passengers || 1 }
      });
      setRides(data || []);

      if (!data || data.length === 0) {
        const poolersRes = await api.get('/poolers/nearby', { params: { lat: 0, lng: 0 } });
        setPoolers(poolersRes.data || []);
      }
    } catch (err) {
      console.log("Search error", err);
      setRides([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [params]);

  const handleBook = async (rideId: string) => {
    setBookingRideId(rideId);
    try {
      await api.post(`/rides/${rideId}/book`);
      Alert.alert('Success', 'Ride booked successfully!', [
        { text: 'View My Rides', onPress: () => router.push('/(employee)/bookings') },
        { text: 'OK', onPress: () => fetchData() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Booking failed');
    }
    setBookingRideId(null);
  };

  // Prepare map data
  let markers: any[] = [];
  if (sourceLoc) markers.push({ id: 'source', latitude: sourceLoc.lat, longitude: sourceLoc.lng, type: 'pickup', title: 'Pickup', subtitle: sourceLoc.name });
  if (destLoc) markers.push({ id: 'dest', latitude: destLoc.lat, longitude: destLoc.lng, type: 'drop', title: 'Drop', subtitle: destLoc.name });
  
  rides.forEach(r => {
    if (r.origin_latitude && r.origin_longitude) {
      markers.push({ id: `ride_${r.id}`, latitude: r.origin_latitude, longitude: r.origin_longitude, type: 'ride', title: r.driver_name, subtitle: `${r.available_seats} seats` });
    }
  });

  const polyline = (sourceLoc && destLoc) ? [
    { latitude: sourceLoc.lat, longitude: sourceLoc.lng },
    { latitude: destLoc.lat, longitude: destLoc.lng }
  ] : [];

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      {/* Map Preview at top */}
      <View style={tw`absolute inset-0 bg-gray-200`}>
         <MapComponent markers={markers} polyline={polyline} />
      </View>

      <View style={tw`absolute top-10 w-full px-4 flex-row items-center z-10`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`bg-white w-10 h-10 rounded-full shadow-md items-center justify-center mr-3`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={tw`flex-1 bg-white px-4 py-3 rounded-2xl shadow-md flex-row items-center justify-between`}>
          <View>
             <Text style={tw`text-[#0F172A] font-extrabold text-base`}>{params.source || 'Anywhere'} → {params.destination || 'Work'}</Text>
             <Text style={tw`text-gray-500 text-xs font-medium mt-0.5`}>{params.date || 'Today'} • {params.passengers || 1} passenger(s)</Text>
          </View>
        </View>
      </View>

      {/* Bottom Sheet Style List */}
      <View style={tw`absolute bottom-0 w-full bg-[#F8FAFC] rounded-t-3xl shadow-xl h-[65%] pt-4`}>
        <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4`} />
        
        <ScrollView contentContainerStyle={tw`px-4 pb-8`}>
          {loading ? (
            <View style={tw`items-center mt-10`}><ActivityIndicator size="large" color="#2563EB" /></View>
          ) : rides.length === 0 ? (
            <View>
              <Text style={tw`text-center text-gray-500 mt-6 mb-6 font-bold text-lg px-4`}>No exact rides found. Try nearby poolers or adjust your time.</Text>
              {poolers.length > 0 && (
                <View>
                  <Text style={tw`text-xl font-extrabold text-[#0F172A] mb-4`}>Suggested Poolers</Text>
                  {poolers.map((pooler, idx) => (
                    <TouchableOpacity 
                      key={idx} 
                      style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex-row items-center`}
                      onPress={() => router.push(`/(employee)/pooler/${pooler.user_id}`)}
                    >
                      <View style={tw`w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-4`}>
                        <Ionicons name="person" size={28} color="#64748b" />
                      </View>
                      <View style={tw`flex-1`}>
                        <Text style={tw`text-lg font-bold text-[#0F172A]`}>{pooler.name || 'Pooler'}</Text>
                        <Text style={tw`text-gray-500 text-xs mb-1`}>{pooler.usual_origin_area} → {pooler.usual_destination_area}</Text>
                        <View style={tw`flex-row items-center`}>
                          <Ionicons name="star" size={12} color="#fbbf24" style={tw`mr-1`} />
                          <Text style={tw`text-gray-600 text-xs font-bold`}>{pooler.rating} • {pooler.trust_score} Trust</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View>
              <Text style={tw`text-xl font-extrabold text-[#0F172A] mb-4`}>Available rides near your route</Text>
              {rides.map((ride, idx) => {
                const stopsBeforeDrop = Math.max(0, (ride.stop_sequence?.length || 2) - 2);

                return (
                <View key={idx} style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4`}>
                  <View style={tw`flex-row justify-between mb-3`}>
                    <View style={tw`flex-row items-center flex-1`}>
                      <View style={tw`w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden border border-gray-200`}>
                        {ride.driver_avatar ? <View style={tw`w-full h-full bg-gray-200`} /> : <Ionicons name="person" size={24} color="#64748b" />}
                      </View>
                      <View style={tw`flex-1 mr-2`}>
                        <Text style={tw`text-lg font-bold text-[#0F172A]`} numberOfLines={1}>{ride.driver_name || 'Pooler'}</Text>
                        <Text style={tw`text-gray-600 text-xs`} numberOfLines={1}>Verified {ride.company_name} Employee</Text>
                      </View>
                    </View>
                  </View>

                  <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
                    <View style={tw`bg-blue-50 px-2 py-1 rounded border border-blue-100 flex-row items-center`}>
                      <Ionicons name="shield-checkmark" size={12} color="#2563EB" style={tw`mr-1`} />
                      <Text style={tw`text-blue-700 text-[10px] font-bold`}>{ride.visibility_badge}</Text>
                    </View>
                    {ride.route_match_score && (
                      <View style={tw`bg-green-50 px-2 py-1 rounded border border-green-100 flex-row items-center`}>
                        <Ionicons name="leaf" size={12} color="#16a34a" style={tw`mr-1`} />
                        <Text style={tw`text-green-700 text-[10px] font-bold`}>Route match: {ride.route_match_score}%</Text>
                      </View>
                    )}
                  </View>

                  <View style={tw`bg-[#F8FAFC] rounded-xl p-3 mb-4 border border-gray-100`}>
                    <Text style={tw`text-[#0F172A] font-bold text-sm mb-1`}>{ride.origin_area} → {ride.destination_area}</Text>
                    <Text style={tw`text-gray-600 text-xs mb-2 font-medium`}>
                      {ride.departure_time ? new Date(ride.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'} → {ride.estimated_arrival_time ? new Date(ride.estimated_arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}
                    </Text>
                    
                    <View style={tw`w-full h-px bg-gray-200 my-2`} />
                    
                    <View style={tw`flex-row justify-between items-center`}>
                      <Text style={tw`text-gray-600 text-xs font-medium`}>{stopsBeforeDrop} stops before drop • <Text style={tw`text-orange-600 font-bold`}>+{ride.detour_minutes || 0} min detour</Text></Text>
                    </View>
                  </View>

                  <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
                    <Text style={tw`text-[#22C55E] font-extrabold text-sm`}>{ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} available</Text>
                    <View style={tw`flex-row items-center`}>
                      <Ionicons name="star" size={14} color="#fbbf24" style={tw`mr-1`} />
                      <Text style={tw`text-gray-700 font-bold`}>{ride.driver_rating || '5.0'}</Text>
                      <Text style={tw`text-gray-500 text-xs ml-1 font-medium`}>({ride.driver_reviews || 0} reviews)</Text>
                    </View>
                  </View>

                  <View style={tw`flex-row gap-3`}>
                    <TouchableOpacity 
                      style={tw`flex-1 bg-white border border-gray-200 py-3.5 rounded-xl items-center shadow-sm`}
                      onPress={() => router.push(`/(employee)/ride/${ride.id}`)}
                    >
                      <Text style={tw`text-[#0F172A] font-bold`}>View Details</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={tw`flex-1 bg-[#2563EB] py-3.5 rounded-xl items-center shadow-sm ${ride.available_seats === 0 || bookingRideId === ride.id ? 'opacity-50' : ''}`}
                      onPress={() => handleBook(ride.id)}
                      disabled={ride.available_seats === 0 || bookingRideId === ride.id}
                    >
                      <Text style={tw`text-white font-bold`}>
                        {bookingRideId === ride.id ? 'Booking...' : ride.available_seats === 0 ? 'Full' : 'Book'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )})}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
