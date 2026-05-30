import { View, Text, TouchableOpacity, ScrollView, Platform, SafeAreaView, Alert, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../../src/utils/api';
import MapComponent from '../../../src/components/MapComponent';

export default function RideDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callLogged, setCallLogged] = useState(false);

  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/rides/${id}`);
        setRide(data);
      } catch (e: any) {
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleBook = async () => {
    setBooking(true);
    try {
      await api.post(`/rides/${id}/book`);
      Alert.alert('Booked!', 'Ride booked successfully.', [
        { text: 'View My Rides', onPress: () => router.push('/(employee)/bookings') }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  const showComingSoon = (feature: string) => {
    Alert.alert('Coming Soon', `${feature} is currently under development.`);
  };

  if (loading) return (
    <View style={tw`flex-1 justify-center items-center bg-[#F8FAFC]`}>
      <Text style={tw`text-gray-500 font-medium`}>Loading ride details…</Text>
    </View>
  );
  if (fetchError) return (
    <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#F8FAFC] px-8`}>
      <Ionicons name="wifi-outline" size={48} color="#94a3b8" />
      <Text style={tw`text-gray-700 font-bold text-lg mt-4 text-center`}>Couldn't load ride</Text>
      <Text style={tw`text-gray-400 text-sm text-center mt-2`}>Check your connection and try again.</Text>
      <TouchableOpacity onPress={() => router.back()} style={tw`mt-6 bg-[#2563EB] px-8 py-3 rounded-xl`} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={tw`text-white font-bold`}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
  if (!ride) return (
    <View style={tw`flex-1 justify-center items-center bg-[#F8FAFC]`}>
      <Text style={tw`text-gray-500`}>Ride not found.</Text>
    </View>
  );

  let markers: any[] = [];
  if (ride.origin_latitude) markers.push({ id: 'start', latitude: ride.origin_latitude, longitude: ride.origin_longitude, type: 'ride', title: 'Driver Start', subtitle: ride.origin_area });
  if (ride.destination_latitude) markers.push({ id: 'end', latitude: ride.destination_latitude, longitude: ride.destination_longitude, type: 'drop', title: 'Driver Drop', subtitle: ride.destination_area });
  
  ride.stop_sequence?.forEach((stop: any, idx: number) => {
    if (stop.latitude && stop.longitude) {
      markers.push({ id: `stop_${idx}`, latitude: stop.latitude, longitude: stop.longitude, type: stop.type === 'PICKUP' ? 'pickup' : 'drop', title: `Co-traveller ${stop.type}`, subtitle: stop.area });
    }
  });

  const polyline = ride.route_coordinates || [];
  const stopsBeforeDrop = Math.max(0, (ride.stop_sequence?.length || 2) - 2);

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      
      {/* Top Map */}
      <View style={tw`h-[35%] bg-gray-200 relative`}>
        <MapComponent markers={markers} polyline={polyline} />
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`absolute top-4 left-4 bg-white w-12 h-12 rounded-full shadow-md items-center justify-center`}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={tw`pb-10 bg-[#F8FAFC] rounded-t-3xl -mt-6 pt-4`}>
        
        {/* Pooler Summary */}
        <View style={tw`bg-white px-6 py-5 border-b border-gray-100 shadow-sm`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <TouchableOpacity onPress={() => router.push(`/(employee)/pooler/${ride.driver_user_id}`)} style={tw`flex-row items-center flex-1`}>
              <View style={tw`w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-3 overflow-hidden border border-gray-200`}>
                {ride.pooler?.profile_photo_url ? <View style={tw`w-full h-full bg-gray-200`} /> : <Ionicons name="person" size={28} color="#64748b" />}
              </View>
              <View>
                <Text style={tw`text-xl font-extrabold text-[#0F172A]`}>{ride.driver?.name}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <Ionicons name="star" size={14} color="#fbbf24" style={tw`mr-1`} />
                  <Text style={tw`text-gray-700 font-bold mr-2`}>{ride.pooler?.rating}</Text>
                  <Text style={tw`text-gray-500 text-xs`}>({ride.pooler?.review_count} reviews) • {ride.pooler?.completed_rides_count} rides</Text>
                </View>
              </View>
            </TouchableOpacity>
            
            <View style={tw`flex-row`}>
              <TouchableOpacity
                onPress={async () => {
                  setShowCallModal(true);
                  if (!callLogged) {
                    setCallLogged(true);
                    try { await api.post('/calls', { ride_id: ride.id, receiver_id: ride.driver_user_id }); } catch {}
                  }
                }}
                style={tw`bg-green-100 w-12 h-12 rounded-full items-center justify-center mr-2 border border-green-200`}
                accessibilityRole="button"
                accessibilityLabel={`Call ${ride.driver?.name || 'driver'}`}
              >
                <Ionicons name="call" size={20} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/(employee)/chat?ride_id=${ride.id}&receiver_id=${ride.driver_user_id}&receiver_name=${ride.driver?.name}`)}
                style={tw`bg-blue-100 w-12 h-12 rounded-full items-center justify-center border border-blue-200`}
                accessibilityRole="button"
                accessibilityLabel={`Message ${ride.driver?.name || 'driver'}`}
              >
                <Ionicons name="chatbubble" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={tw`flex-row flex-wrap gap-2`}>
            <View style={tw`bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center border border-blue-100`}>
              <Ionicons name="shield-checkmark" size={14} color="#2563EB" style={tw`mr-1.5`} />
              <Text style={tw`text-blue-700 text-xs font-bold`}>Company Circle • {ride.company_name}</Text>
            </View>
            <View style={tw`bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center border border-gray-200`}>
              <Ionicons name="car" size={14} color="#475569" style={tw`mr-1.5`} />
              <Text style={tw`text-gray-700 text-xs font-bold`}>{ride.pooler?.vehicle_type}</Text>
            </View>
          </View>
        </View>

        {/* Route Transparency */}
        <View style={tw`px-6 pt-6`}>
          <Text style={tw`text-lg font-extrabold text-[#0F172A] mb-4`}>Route Transparency</Text>
          
          <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
            
            {/* Privacy Note */}
            <View style={tw`bg-gray-50 p-3 rounded-lg flex-row items-start mb-5 border border-gray-200`}>
              <Ionicons name="lock-closed" size={16} color="#64748b" style={tw`mr-2 mt-0.5`} />
              <Text style={tw`text-gray-500 text-xs flex-1 leading-relaxed`}>
                Privacy protected: Exact passenger names, phone numbers, and exact locations are hidden before booking.
              </Text>
            </View>

            <View style={tw`flex-row justify-between mb-6 pb-4 border-b border-gray-100`}>
              <View>
                <Text style={tw`text-gray-500 text-xs mb-1 font-medium`}>Route Match</Text>
                <Text style={tw`text-[#22C55E] font-extrabold text-xl`}>{ride.route_match_score || 0}%</Text>
              </View>
              <View style={tw`items-center`}>
                <Text style={tw`text-gray-500 text-xs mb-1 font-medium`}>Detour</Text>
                <Text style={tw`text-orange-600 font-extrabold text-xl`}>+{ride.detour_minutes || 0} min</Text>
              </View>
              <View style={tw`items-end`}>
                <Text style={tw`text-gray-500 text-xs mb-1 font-medium`}>Available Seats</Text>
                <Text style={tw`text-[#0F172A] font-extrabold text-xl`}>{ride.available_seats}/{ride.total_seats}</Text>
              </View>
            </View>

            {/* Timeline */}
            <Text style={tw`font-bold text-[#0F172A] mb-4`}>Planned Route Sequence</Text>
            
            <View style={tw`flex-row mb-4 relative`}>
              <View style={tw`absolute left-3 top-6 w-0.5 h-full bg-gray-200`} />
              <View style={tw`w-6 h-6 rounded-full bg-gray-800 items-center justify-center mr-4 mt-1 border-2 border-white z-10`}>
                 <Ionicons name="car" size={12} color="white" />
              </View>
              <View style={tw`flex-1 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100`}>
                <Text style={tw`font-bold text-[#0F172A]`}>Driver starts: {ride.origin_area}</Text>
                <Text style={tw`text-gray-500 text-xs mt-1`}>Expected: {ride.departure_time ? new Date(ride.departure_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</Text>
              </View>
            </View>

            {ride.stop_sequence?.map((stop: any, index: number) => (
              <View key={index} style={tw`flex-row mb-4 relative`}>
                {index !== ride.stop_sequence.length - 1 && (
                  <View style={tw`absolute left-3 top-6 w-0.5 h-full bg-gray-200`} />
                )}
                <View style={tw`w-6 h-6 rounded-full ${stop.type === 'PICKUP' ? 'bg-[#2563EB]' : 'bg-[#ea580c]'} items-center justify-center mr-4 mt-1 border-2 border-white z-10`}>
                  <View style={tw`w-2 h-2 rounded-full bg-white`} />
                </View>
                <View style={tw`flex-1 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100`}>
                  <Text style={tw`font-bold text-[#0F172A]`}>{stop.area}</Text>
                  <Text style={tw`text-gray-500 text-xs mt-1`}>{stop.time} • Co-traveller {stop.type.toLowerCase()}</Text>
                </View>
              </View>
            ))}

            <View style={tw`flex-row justify-between items-center mt-2 pt-4 border-t border-gray-100`}>
               <Text style={tw`text-gray-600 text-sm font-medium`}>{stopsBeforeDrop} stops before drop</Text>
               <Text style={tw`text-gray-600 text-sm font-medium`}>{ride.current_passenger_count} passengers</Text>
            </View>
          </View>
        </View>

        {/* AI Assist */}
        <View style={tw`px-6 mt-6`}>
          <TouchableOpacity onPress={() => router.push(`/(employee)/ai?ride_id=${ride.id}`)} style={tw`bg-purple-50 rounded-2xl p-4 flex-row items-center border border-purple-100 shadow-sm`}>
            <View style={tw`bg-purple-200 w-12 h-12 rounded-full items-center justify-center mr-4`}>
              <Ionicons name="sparkles" size={24} color="#9333ea" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-purple-900 font-extrabold text-base mb-0.5`}>Ask AI about this ride</Text>
              <Text style={tw`text-purple-700 text-xs font-medium`}>Get route insights, safety checks, and pooler reliability summaries.</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9333ea" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Bottom Sticky Action */}
      <View style={tw`bg-white px-6 py-4 border-t border-gray-100 shadow-[0_-4px_6px_rgba(0,0,0,0.05)]`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-gray-600 font-medium`}>{ride.current_passenger_count} passenger(s) currently booked</Text>
          <Text style={tw`font-extrabold text-[#0F172A]`}>ETA: {ride.estimated_arrival_time ? new Date(ride.estimated_arrival_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</Text>
        </View>
        <TouchableOpacity 
          style={tw`w-full bg-[#2563EB] py-4 rounded-xl items-center shadow-md ${ride.available_seats === 0 ? 'opacity-50' : ''}`}
          onPress={handleBook}
          disabled={ride.available_seats === 0 || booking}
        >
          <Text style={tw`text-white font-bold text-lg`}>{booking ? 'Booking...' : ride.available_seats === 0 ? 'Full' : 'Book Seat'}</Text>
        </TouchableOpacity>
      </View>

      {/* Call Modal Simulation */}
      <Modal visible={showCallModal} transparent animationType="slide">
        <View style={tw`flex-1 bg-black/95 justify-center items-center p-6`}>
           <Text style={tw`text-gray-400 font-bold mb-8 uppercase tracking-widest`}>RouteMate Secure Call</Text>
           <View style={tw`w-32 h-32 bg-gray-800 rounded-full mb-6 items-center justify-center border-4 border-gray-700`}>
              <Ionicons name="person" size={64} color="white" />
           </View>
           <Text style={tw`text-white text-3xl font-extrabold mb-2`}>{ride.driver?.name}</Text>
           <Text style={tw`text-green-400 text-lg mb-16 font-bold`}>Connected... 00:12</Text>
           
           <View style={tw`flex-row gap-8`}>
             <TouchableOpacity style={tw`w-16 h-16 bg-gray-800 rounded-full items-center justify-center border border-gray-700`}>
               <Ionicons name="mic-off" size={28} color="white" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setShowCallModal(false)} style={tw`w-16 h-16 bg-red-500 rounded-full items-center justify-center shadow-lg`}>
               <Ionicons name="call" size={28} color="white" style={{transform: [{rotate: '135deg'}]}} />
             </TouchableOpacity>
             <TouchableOpacity style={tw`w-16 h-16 bg-gray-800 rounded-full items-center justify-center border border-gray-700`}>
               <Ionicons name="volume-high" size={28} color="white" />
             </TouchableOpacity>
           </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
