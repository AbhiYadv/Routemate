import {
  View, Text, TouchableOpacity, ScrollView, Platform,
  SafeAreaView, Alert, Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { api } from '../../../src/utils/api';
import { useNotificationStore } from '../../../src/store/notifications';
import MapComponent from '../../../src/components/MapComponent';

export default function RideDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { push: pushNotif } = useNotificationStore();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [booking, setBooking] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callLogged, setCallLogged] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/rides/${id}`);
        setRide(data);
      } catch {
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
      // Push in-app notification
      pushNotif({
        type: 'booking',
        title: 'Ride Booked!',
        body: `Your seat with ${ride?.driver?.name || 'your driver'} on the ${ride?.origin_area} → ${ride?.destination_area} route is confirmed. ETA ${ride?.estimated_arrival_time ? new Date(ride.estimated_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}.`,
        rideId: id as string,
      });
      Alert.alert('Booked!', 'Your seat is confirmed.', [
        { text: 'View My Rides', onPress: () => router.push('/(employee)/bookings') },
        { text: 'OK' },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#F0F4FF]`}>
      <Ionicons name="car-sport-outline" size={40} color="#93c5fd" />
      <Text style={tw`text-gray-500 font-medium mt-3`}>Loading ride details…</Text>
    </SafeAreaView>
  );

  if (fetchError) return (
    <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#F0F4FF] px-8`}>
      <Ionicons name="wifi-outline" size={48} color="#94a3b8" />
      <Text style={tw`text-gray-700 font-bold text-lg mt-4 text-center`}>Couldn't load ride</Text>
      <Text style={tw`text-gray-400 text-sm text-center mt-2`}>Check your connection and try again.</Text>
      <TouchableOpacity
        onPress={() => router.back()}
        style={tw`mt-6 bg-[#2563EB] px-8 py-3 rounded-xl`}
        accessibilityRole="button" accessibilityLabel="Go back"
      >
        <Text style={tw`text-white font-bold`}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  if (!ride) return (
    <SafeAreaView style={tw`flex-1 justify-center items-center bg-[#F0F4FF]`}>
      <Text style={tw`text-gray-500`}>Ride not found.</Text>
    </SafeAreaView>
  );

  // Map data
  const markers: any[] = [];
  if (ride.origin_latitude) markers.push({ id: 'start', latitude: ride.origin_latitude, longitude: ride.origin_longitude, type: 'ride', title: 'Driver Start', subtitle: ride.origin_area });
  if (ride.destination_latitude) markers.push({ id: 'end', latitude: ride.destination_latitude, longitude: ride.destination_longitude, type: 'drop', title: 'Driver Drop', subtitle: ride.destination_area });
  ride.stop_sequence?.forEach((stop: any, idx: number) => {
    if (stop.latitude && stop.longitude) markers.push({ id: `stop_${idx}`, latitude: stop.latitude, longitude: stop.longitude, type: stop.type === 'PICKUP' ? 'pickup' : 'drop', title: `Co-traveller ${stop.type}`, subtitle: stop.area });
  });
  const polyline = ride.route_coordinates || [];
  const stopsBeforeDrop = Math.max(0, (ride.stop_sequence?.length ?? 0) - 2);

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F0F4FF] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      {/*
        SCROLL FIX: The map is now INSIDE the ScrollView, not a fixed element above it.
        This lets the user scroll naturally — pull up to read details, pull down to see more map.
        The sticky Book Seat CTA stays outside (below) the ScrollView.
      */}
      <ScrollView
        contentContainerStyle={tw`pb-36`}
        showsVerticalScrollIndicator={false}
        bounces
      >
        {/* ── Map section — scrolls with content ── */}
        <View style={tw`h-56 bg-gray-200 relative`}>
          <MapComponent markers={markers} polyline={polyline} />
          <TouchableOpacity
            onPress={() => router.back()}
            style={tw`absolute top-4 left-4 bg-white w-12 h-12 rounded-full shadow-md items-center justify-center`}
            accessibilityRole="button" accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
          {/* Badge overlay */}
          <View style={tw`absolute top-4 right-4 bg-[#0F172A]/80 px-3 py-1.5 rounded-full flex-row items-center`}>
            <View style={tw`w-2 h-2 rounded-full bg-[#22C55E] mr-1.5`} />
            <Text style={tw`text-white text-xs font-semibold`}>Live route</Text>
          </View>
        </View>

        {/* ── Pooler summary card ── */}
        <View style={tw`bg-white mx-4 -mt-5 rounded-2xl p-5 shadow-lg border border-gray-100`}>
          <View style={tw`flex-row items-center justify-between mb-4`}>
            <TouchableOpacity
              onPress={() => router.push(`/(employee)/pooler/${ride.driver_user_id}`)}
              style={tw`flex-row items-center flex-1`}
              accessibilityRole="button" accessibilityLabel={`View ${ride.driver?.name}'s profile`}
            >
              <View style={tw`w-14 h-14 bg-blue-50 rounded-full items-center justify-center mr-3 border border-blue-100`}>
                <Ionicons name="person" size={28} color="#2563EB" />
              </View>
              <View>
                <Text style={tw`text-xl font-bold text-[#0F172A]`}>{ride.driver?.name}</Text>
                <View style={tw`flex-row items-center mt-1`}>
                  <Ionicons name="star" size={13} color="#fbbf24" style={tw`mr-1`} />
                  <Text style={tw`text-gray-700 font-semibold mr-1`}>{ride.pooler?.rating}</Text>
                  <Text style={tw`text-gray-400 text-xs`}>({ride.pooler?.review_count} reviews) · {ride.pooler?.completed_rides_count} rides</Text>
                </View>
              </View>
            </TouchableOpacity>

            <View style={tw`flex-row gap-2`}>
              <TouchableOpacity
                onPress={async () => {
                  setShowCallModal(true);
                  if (!callLogged) {
                    setCallLogged(true);
                    try { await api.post('/calls', { ride_id: ride.id, receiver_id: ride.driver_user_id }); } catch {}
                  }
                }}
                style={tw`w-12 h-12 bg-green-50 rounded-full items-center justify-center border border-green-100`}
                accessibilityRole="button" accessibilityLabel={`Call ${ride.driver?.name || 'driver'}`}
              >
                <Ionicons name="call" size={20} color="#16a34a" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/(employee)/chat?ride_id=${ride.id}&receiver_id=${ride.driver_user_id}&receiver_name=${ride.driver?.name}`)}
                style={tw`w-12 h-12 bg-blue-50 rounded-full items-center justify-center border border-blue-100`}
                accessibilityRole="button" accessibilityLabel={`Message ${ride.driver?.name || 'driver'}`}
              >
                <Ionicons name="chatbubble" size={20} color="#2563EB" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Badges */}
          <View style={tw`flex-row flex-wrap gap-2`}>
            <View style={tw`bg-blue-50 px-3 py-1.5 rounded-full flex-row items-center border border-blue-100`}>
              <Ionicons name="shield-checkmark" size={13} color="#2563EB" style={tw`mr-1`} />
              <Text style={tw`text-blue-700 text-xs font-semibold`}>Company Circle · {ride.company_name}</Text>
            </View>
            {ride.pooler?.vehicle_type && (
              <View style={tw`bg-gray-50 px-3 py-1.5 rounded-full flex-row items-center border border-gray-200`}>
                <Ionicons name="car" size={13} color="#475569" style={tw`mr-1`} />
                <Text style={tw`text-gray-600 text-xs font-semibold`}>{ride.pooler.vehicle_type}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={tw`mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm`}>
          <View style={tw`flex-row`}>
            {[
              { label: 'Route Match', value: `${ride.route_match_score || 0}%`, color: '#22C55E' },
              { label: 'Detour', value: `+${ride.detour_minutes || 0} min`, color: '#ea580c' },
              { label: 'Seats Left', value: `${ride.available_seats}/${ride.total_seats}`, color: '#2563EB' },
            ].map((stat, i) => (
              <View key={stat.label} style={tw`flex-1 py-4 items-center ${i < 2 ? 'border-r border-gray-100' : ''}`}>
                <Text style={[tw`text-xl font-bold`, { color: stat.color }]}>{stat.value}</Text>
                <Text style={tw`text-gray-400 text-[10px] font-medium mt-0.5 uppercase tracking-wide`}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Route Transparency ── */}
        <View style={tw`px-4 mt-4`}>
          <Text style={tw`text-[#0F172A] font-bold text-base mb-3`}>Route Transparency</Text>

          <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
            {/* Privacy note */}
            <View style={tw`bg-[#F1F5F9] p-3 rounded-xl flex-row items-start mb-5`}>
              <Ionicons name="lock-closed" size={14} color="#64748b" style={tw`mr-2 mt-0.5`} />
              <Text style={tw`text-gray-500 text-xs flex-1 leading-relaxed`}>
                Exact names, phones, and locations are hidden before booking.
              </Text>
            </View>

            {/* Driver start */}
            <View style={tw`flex-row mb-4 relative`}>
              <View style={tw`absolute left-3 top-6 w-px h-full bg-gray-200`} />
              <View style={tw`w-6 h-6 rounded-full bg-[#0F172A] items-center justify-center mr-4 mt-1 z-10`}>
                <Ionicons name="car" size={12} color="white" />
              </View>
              <View style={tw`flex-1 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100`}>
                <Text style={tw`font-semibold text-[#0F172A] text-sm`}>Driver starts: {ride.origin_area}</Text>
                <Text style={tw`text-gray-400 text-xs mt-0.5`}>
                  {ride.departure_time ? new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
                </Text>
              </View>
            </View>

            {ride.stop_sequence?.map((stop: any, idx: number) => (
              <View key={idx} style={tw`flex-row mb-4 relative`}>
                {idx !== ride.stop_sequence.length - 1 && (
                  <View style={tw`absolute left-3 top-6 w-px h-full bg-gray-200`} />
                )}
                <View style={[
                  tw`w-6 h-6 rounded-full items-center justify-center mr-4 mt-1 z-10`,
                  { backgroundColor: stop.type === 'PICKUP' ? '#2563EB' : '#ea580c' },
                ]}>
                  <View style={tw`w-2 h-2 rounded-full bg-white`} />
                </View>
                <View style={tw`flex-1 bg-[#F8FAFC] p-3 rounded-xl border border-gray-100`}>
                  <Text style={tw`font-semibold text-[#0F172A] text-sm`}>{stop.area}</Text>
                  <Text style={tw`text-gray-400 text-xs mt-0.5`}>{stop.time} · Co-traveller {stop.type.toLowerCase()}</Text>
                </View>
              </View>
            ))}

            <View style={tw`flex-row justify-between items-center mt-1 pt-4 border-t border-gray-100`}>
              <Text style={tw`text-gray-500 text-xs`}>{stopsBeforeDrop} stops before drop</Text>
              <Text style={tw`text-gray-500 text-xs`}>{ride.current_passenger_count} passenger(s)</Text>
            </View>
          </View>
        </View>

        {/* ── AI Assist ── */}
        <View style={tw`px-4 mt-4`}>
          <TouchableOpacity
            onPress={() => router.push(`/(employee)/ai?ride_id=${ride.id}`)}
            style={tw`bg-[#1E1B4B] rounded-2xl p-4 flex-row items-center shadow-sm`}
            accessibilityRole="button" accessibilityLabel="Ask AI about this ride"
          >
            <View style={tw`bg-[#312E81] w-11 h-11 rounded-full items-center justify-center mr-4`}>
              <Ionicons name="sparkles" size={22} color="#a5b4fc" />
            </View>
            <View style={tw`flex-1`}>
              <Text style={tw`text-white font-bold text-sm mb-0.5`}>Ask AI about this ride</Text>
              <Text style={tw`text-indigo-300 text-xs`}>Route insights, safety checks, pooler reliability.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#818cf8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Sticky Book Seat CTA ── */}
      <View style={tw`bg-white px-5 py-4 border-t border-gray-100 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]`}>
        <View style={tw`flex-row justify-between items-center mb-3`}>
          <Text style={tw`text-gray-500 text-xs`}>{ride.current_passenger_count} passenger(s) booked</Text>
          <Text style={tw`font-bold text-[#0F172A] text-sm`}>
            ETA {ride.estimated_arrival_time ? new Date(ride.estimated_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}
          </Text>
        </View>
        <TouchableOpacity
          style={tw`w-full bg-[#2563EB] py-4 rounded-xl items-center shadow-md ${ride.available_seats === 0 || booking ? 'opacity-50' : ''}`}
          onPress={handleBook}
          disabled={ride.available_seats === 0 || booking}
          accessibilityRole="button"
          accessibilityLabel={ride.available_seats === 0 ? 'Ride full' : 'Book seat'}
        >
          <Text style={tw`text-white font-bold text-base`}>
            {booking ? 'Booking…' : ride.available_seats === 0 ? 'Ride Full' : 'Book Seat'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Call modal ── */}
      <Modal visible={showCallModal} transparent animationType="fade">
        <View style={tw`flex-1 bg-[#0F172A]/95 justify-center items-center p-6`}>
          <Text style={tw`text-gray-400 font-semibold text-xs mb-8 uppercase tracking-widest`}>
            RouteMate Secure Call
          </Text>
          <View style={tw`w-28 h-28 bg-[#1E3A5F] rounded-full mb-5 items-center justify-center border-2 border-[#2563EB]/40`}>
            <Ionicons name="person" size={56} color="#60A5FA" />
          </View>
          <Text style={tw`text-white text-2xl font-bold mb-1`}>{ride.driver?.name}</Text>
          <Text style={tw`text-[#22C55E] text-sm mb-14 font-semibold`}>Connected · 00:12</Text>
          <View style={tw`flex-row gap-8`}>
            <TouchableOpacity
              style={tw`w-16 h-16 bg-white/10 rounded-full items-center justify-center border border-white/20`}
              accessibilityRole="button" accessibilityLabel="Mute"
            >
              <Ionicons name="mic-off" size={26} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowCallModal(false)}
              style={tw`w-16 h-16 bg-red-500 rounded-full items-center justify-center shadow-lg`}
              accessibilityRole="button" accessibilityLabel="End call"
            >
              <Ionicons name="call" size={26} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
            </TouchableOpacity>
            <TouchableOpacity
              style={tw`w-16 h-16 bg-white/10 rounded-full items-center justify-center border border-white/20`}
              accessibilityRole="button" accessibilityLabel="Speaker"
            >
              <Ionicons name="volume-high" size={26} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
