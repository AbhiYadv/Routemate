import {
  View, Text, TouchableOpacity, Platform, SafeAreaView,
  Alert, ActivityIndicator, FlatList, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { api } from '../../src/utils/api';
import { useNotificationStore } from '../../src/store/notifications';
import MapComponent from '../../src/components/MapComponent';
import { LOCATIONS } from '../../src/utils/locations';

// Skeleton card for loading state
function RideSkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[tw`bg-white rounded-2xl p-4 mb-4 border border-gray-100`, { opacity }]}>
      <View style={tw`flex-row items-center mb-3`}>
        <View style={tw`w-12 h-12 bg-gray-200 rounded-full mr-3`} />
        <View style={tw`flex-1`}>
          <View style={tw`h-4 bg-gray-200 rounded w-3/4 mb-2`} />
          <View style={tw`h-3 bg-gray-100 rounded w-1/2`} />
        </View>
      </View>
      <View style={tw`h-3 bg-gray-100 rounded mb-2`} />
      <View style={tw`h-3 bg-gray-100 rounded w-4/5 mb-4`} />
      <View style={tw`flex-row gap-3`}>
        <View style={tw`flex-1 h-10 bg-gray-100 rounded-xl`} />
        <View style={tw`flex-1 h-10 bg-green-100 rounded-xl`} />
      </View>
    </Animated.View>
  );
}

// Memoized ride card
function RideCard({ ride, onBook, onViewDetails, bookingRideId }: {
  ride: any;
  onBook: (id: string) => void;
  onViewDetails: (id: string) => void;
  bookingRideId: string | null;
}) {
  const stopsBeforeDrop = Math.max(0, (ride.stop_sequence?.length ?? 0) - 2);
  const isBooking = bookingRideId === ride.id;
  const isFull = ride.available_seats === 0;

  return (
    <View style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4`}>
      <View style={tw`flex-row justify-between mb-3`}>
        <View style={tw`flex-row items-center flex-1`}>
          <View style={tw`w-12 h-12 bg-gray-100 rounded-full items-center justify-center mr-3 border border-gray-200`}>
            <Ionicons name="person" size={24} color="#64748b" />
          </View>
          <View style={tw`flex-1 mr-2`}>
            <Text style={tw`text-lg font-bold text-[#0F172A]`} numberOfLines={1}>
              {ride.driver_name || 'Pooler'}
            </Text>
            <Text style={tw`text-gray-600 text-xs`} numberOfLines={1}>
              Verified {ride.company_name} Employee
            </Text>
          </View>
        </View>
      </View>

      <View style={tw`flex-row flex-wrap gap-2 mb-3`}>
        <View style={tw`bg-green-50 px-2 py-1 rounded border border-green-100 flex-row items-center`}>
          <Ionicons name="shield-checkmark" size={12} color="#16a34a" style={tw`mr-1`} />
          <Text style={tw`text-green-700 text-[10px] font-bold`}>{ride.visibility_badge}</Text>
        </View>
        {!!ride.route_match_score && (
          <View style={tw`bg-green-50 px-2 py-1 rounded border border-green-100 flex-row items-center`}>
            <Ionicons name="leaf" size={12} color="#16a34a" style={tw`mr-1`} />
            <Text style={tw`text-green-700 text-[10px] font-bold`}>Match: {ride.route_match_score}%</Text>
          </View>
        )}
        {ride.route_match_score === 0 && (
          <View style={tw`bg-gray-50 px-2 py-1 rounded border border-gray-200 flex-row items-center`}>
            <Ionicons name="leaf" size={12} color="#94a3b8" style={tw`mr-1`} />
            <Text style={tw`text-gray-500 text-[10px] font-bold`}>Match: 0%</Text>
          </View>
        )}
      </View>

      <View style={tw`bg-[#F8FAFC] rounded-xl p-3 mb-4 border border-gray-100`}>
        <Text style={tw`text-[#0F172A] font-bold text-sm mb-1`}>
          {ride.origin_area} → {ride.destination_area}
        </Text>
        <Text style={tw`text-gray-600 text-xs mb-2 font-medium`}>
          {ride.departure_time
            ? new Date(ride.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--'}{' '}
          →{' '}
          {ride.estimated_arrival_time
            ? new Date(ride.estimated_arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '--'}
        </Text>
        <View style={tw`w-full h-px bg-gray-200 my-2`} />
        <Text style={tw`text-gray-600 text-xs font-medium`}>
          {stopsBeforeDrop} stop{stopsBeforeDrop !== 1 ? 's' : ''} before drop
          {'  '}
          <Text style={tw`text-orange-600 font-bold`}>+{ride.detour_minutes || 0} min detour</Text>
        </Text>
      </View>

      <View style={tw`flex-row justify-between items-center mb-4 px-1`}>
        <Text style={tw`text-[#22C55E] font-bold text-sm`}>
          {ride.available_seats} seat{ride.available_seats !== 1 ? 's' : ''} left
        </Text>
        <View style={tw`flex-row items-center`}>
          <Ionicons name="star" size={14} color="#fbbf24" style={tw`mr-1`} />
          <Text style={tw`text-gray-700 font-bold`}>{ride.driver_rating || '5.0'}</Text>
          <Text style={tw`text-gray-500 text-xs ml-1`}>({ride.driver_reviews || 0})</Text>
        </View>
      </View>

      <View style={tw`flex-row gap-3`}>
        <TouchableOpacity
          style={tw`flex-1 bg-white border border-gray-200 py-3.5 rounded-xl items-center`}
          onPress={() => onViewDetails(ride.id)}
          accessibilityRole="button"
          accessibilityLabel={`View details for ${ride.driver_name || 'this ride'}`}
        >
          <Text style={tw`text-[#0F172A] font-bold`}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw`flex-1 bg-[#16a34a] py-3.5 rounded-xl items-center ${isFull || isBooking ? 'opacity-50' : ''}`}
          onPress={() => onBook(ride.id)}
          disabled={isFull || isBooking}
          accessibilityRole="button"
          accessibilityLabel={isFull ? 'Ride full' : `Book ride with ${ride.driver_name || 'driver'}`}
        >
          <Text style={tw`text-white font-bold`}>
            {isBooking ? 'Booking…' : isFull ? 'Full' : 'Book'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Pooler card
function PoolerCard({ pooler, onPress }: { pooler: any; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={tw`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4 flex-row items-center`}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View profile of ${pooler.name || 'pooler'}`}
    >
      <View style={tw`w-14 h-14 bg-gray-100 rounded-full items-center justify-center mr-4`}>
        <Ionicons name="person" size={28} color="#64748b" />
      </View>
      <View style={tw`flex-1`}>
        <Text style={tw`text-lg font-bold text-[#0F172A]`}>{pooler.name || 'Pooler'}</Text>
        <Text style={tw`text-gray-500 text-xs mb-1`}>
          {pooler.usual_origin_area} → {pooler.usual_destination_area}
        </Text>
        <View style={tw`flex-row items-center`}>
          <Ionicons name="star" size={12} color="#fbbf24" style={tw`mr-1`} />
          <Text style={tw`text-gray-600 text-xs font-bold`}>
            {pooler.rating} • {pooler.trust_score} Trust
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchResults() {
  const router = useRouter();
  // Destructure primitive values to avoid infinite useEffect loop from object reference instability
  const { source, destination, date, passengers } = useLocalSearchParams<{
    source: string;
    destination: string;
    date: string;
    passengers: string;
  }>();

  const { push: pushNotif } = useNotificationStore();
  const [rides, setRides] = useState<any[]>([]);
  const [poolers, setPoolers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [bookingRideId, setBookingRideId] = useState<string | null>(null);

  const sourceLoc = LOCATIONS.find((l) => l.name === source);
  const destLoc = LOCATIONS.find((l) => l.name === destination);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const { data } = await api.get('/rides/search', {
        params: { source, destination, passengers: passengers || 1 },
      });
      setRides(data || []);
      if (!data || data.length === 0) {
        const poolersRes = await api.get('/poolers/nearby', { params: { lat: 0, lng: 0 } });
        setPoolers(poolersRes.data || []);
      } else {
        setPoolers([]);
      }
    } catch (err) {
      setFetchError(true);
      setRides([]);
      setPoolers([]);
    } finally {
      setLoading(false);
    }
  };

  // Depend only on primitive values — avoids infinite loop from object ref changes
  useEffect(() => {
    fetchData();
  }, [source, destination, passengers]);

  const handleBook = async (rideId: string) => {
    setBookingRideId(rideId);
    try {
      await api.post(`/rides/${rideId}/book`);
      const booked = rides.find((r) => r.id === rideId);
      pushNotif({
        type: 'booking',
        title: 'Ride Booked!',
        body: booked
          ? `Seat confirmed with ${booked.driver_name} — ${booked.origin_area} → ${booked.destination_area}`
          : 'Your ride is confirmed. Check My Rides for details.',
        rideId,
      });
      Alert.alert('Booked!', 'Ride booked successfully.', [
        { text: 'View My Rides', onPress: () => router.push('/(employee)/bookings') },
        { text: 'OK', onPress: fetchData },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Booking failed');
    } finally {
      setBookingRideId(null);
    }
  };

  // Map markers
  const markers: any[] = [];
  if (sourceLoc) markers.push({ id: 'source', latitude: sourceLoc.lat, longitude: sourceLoc.lng, type: 'pickup', title: 'Pickup', subtitle: sourceLoc.name });
  if (destLoc) markers.push({ id: 'dest', latitude: destLoc.lat, longitude: destLoc.lng, type: 'drop', title: 'Drop', subtitle: destLoc.name });
  rides.forEach((r) => {
    if (r.origin_latitude && r.origin_longitude) {
      markers.push({ id: `ride_${r.id}`, latitude: r.origin_latitude, longitude: r.origin_longitude, type: 'ride', title: r.driver_name, subtitle: `${r.available_seats} seats` });
    }
  });
  const polyline = sourceLoc && destLoc
    ? [{ latitude: sourceLoc.lat, longitude: sourceLoc.lng }, { latitude: destLoc.lat, longitude: destLoc.lng }]
    : [];

  const renderRide = ({ item }: { item: any }) => (
    <RideCard
      ride={item}
      onBook={handleBook}
      onViewDetails={(id) => router.push(`/(employee)/ride/${id}`)}
      bookingRideId={bookingRideId}
    />
  );

  const renderEmptySearch = () => (
    <View>
      {fetchError ? (
        <View style={tw`items-center mt-10 px-4`}>
          <Ionicons name="wifi-outline" size={48} color="#94a3b8" />
          <Text style={tw`text-gray-600 font-bold text-lg mt-4 text-center`}>Connection issue</Text>
          <Text style={tw`text-gray-400 text-sm text-center mt-2`}>Check your connection and try again.</Text>
          <TouchableOpacity
            style={tw`mt-6 bg-[#16a34a] px-8 py-3 rounded-xl`}
            onPress={fetchData}
            accessibilityRole="button"
            accessibilityLabel="Retry search"
          >
            <Text style={tw`text-white font-bold`}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <View style={tw`items-center mt-6 mb-6 px-4`}>
            <Ionicons name="search-outline" size={48} color="#94a3b8" />
            <Text style={tw`text-gray-600 font-bold text-lg mt-4 text-center`}>
              No rides found for this route
            </Text>
            <Text style={tw`text-gray-400 text-sm text-center mt-2`}>
              Try adjusting your time or check a nearby pooler below.
            </Text>
          </View>
          {poolers.length > 0 && (
            <>
              <Text style={tw`text-xl font-bold text-[#0F172A] mb-4`}>Nearby Poolers</Text>
              {poolers.map((pooler, idx) => (
                <PoolerCard
                  key={idx}
                  pooler={pooler}
                  onPress={() => router.push(`/(employee)/pooler/${pooler.user_id}`)}
                />
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`absolute inset-0 bg-gray-200`}>
        <MapComponent markers={markers} polyline={polyline} />
      </View>

      {/* Search bar overlay */}
      <View style={tw`absolute top-10 w-full px-4 flex-row items-center z-10`}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={tw`bg-white w-12 h-12 rounded-full shadow-md items-center justify-center mr-3`}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <View style={tw`flex-1 bg-white px-4 py-3 rounded-2xl shadow-md`}>
          <Text style={tw`text-[#0F172A] font-bold text-base`}>
            {source || 'Anywhere'} → {destination || 'Work'}
          </Text>
          <Text style={tw`text-gray-500 text-xs mt-0.5`}>
            {date || 'Today'} • {passengers || 1} passenger(s)
          </Text>
        </View>
      </View>

      {/* Bottom sheet */}
      <View style={tw`absolute bottom-0 w-full bg-[#F8FAFC] rounded-t-3xl shadow-xl h-[65%] pt-4`}>
        <View style={tw`w-12 h-1.5 bg-gray-300 rounded-full self-center mb-4`} />

        {loading ? (
          <View style={tw`px-4`}>
            <Text style={tw`text-xl font-bold text-[#0F172A] mb-4`}>Finding rides…</Text>
            {[1, 2, 3].map((i) => <RideSkeletonCard key={i} />)}
          </View>
        ) : (
          <FlatList
            data={rides.length > 0 ? rides : []}
            keyExtractor={(item) => item.id}
            renderItem={renderRide}
            contentContainerStyle={tw`px-4 pb-8`}
            ListHeaderComponent={
              rides.length > 0
                ? <Text style={tw`text-xl font-bold text-[#0F172A] mb-4`}>Rides near your route</Text>
                : null
            }
            ListEmptyComponent={renderEmptySearch()}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
