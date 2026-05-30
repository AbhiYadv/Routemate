import {
  View, Text, SafeAreaView, TouchableOpacity, ScrollView,
  Platform, TextInput, Modal, Alert,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { useAuthStore } from '../../src/store/auth';
import { useNotificationStore, unreadCount } from '../../src/store/notifications';
import { api } from '../../src/utils/api';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withSequence, Easing,
} from 'react-native-reanimated';
import Logo from '../../src/components/Logo';
import { LOCATIONS } from '../../src/utils/locations';

// ── Notification panel ──────────────────────────────────────────────────────
function NotificationPanel({
  visible, onClose,
}: { visible: boolean; onClose: () => void }) {
  const { notifications, markAllRead, clear } = useNotificationStore();

  const iconMap: Record<string, any> = {
    booking: 'checkmark-circle',
    ride_update: 'car',
    sos: 'alert-circle',
    system: 'information-circle',
  };
  const colorMap: Record<string, string> = {
    booking: '#22C55E',
    ride_update: '#2563EB',
    sos: '#dc2626',
    system: '#6366f1',
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
        <View style={tw`px-5 py-4 flex-row items-center justify-between border-b border-gray-100 bg-white`}>
          <Text style={tw`text-[#0F172A] text-xl font-bold`}>Notifications</Text>
          <View style={tw`flex-row items-center gap-4`}>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={markAllRead}>
                <Text style={tw`text-[#2563EB] text-sm font-semibold`}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={onClose}
              style={tw`w-9 h-9 bg-gray-100 rounded-full items-center justify-center`}
              accessibilityRole="button" accessibilityLabel="Close notifications"
            >
              <Ionicons name="close" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center`}>
            <View style={tw`w-16 h-16 bg-blue-50 rounded-full items-center justify-center mb-4`}>
              <Ionicons name="notifications-outline" size={32} color="#93c5fd" />
            </View>
            <Text style={tw`text-[#0F172A] font-bold text-lg`}>All caught up</Text>
            <Text style={tw`text-gray-400 text-sm mt-1 text-center px-8`}>
              Booking confirmations and ride updates will appear here.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={tw`p-4 pb-8`}>
            {notifications.map((n) => (
              <View
                key={n.id}
                style={tw`bg-white rounded-2xl p-4 mb-3 border ${n.read ? 'border-gray-100' : 'border-blue-100'} shadow-sm flex-row items-start`}
              >
                <View
                  style={[
                    tw`w-10 h-10 rounded-full items-center justify-center mr-3 mt-0.5`,
                    { backgroundColor: `${colorMap[n.type]}18` },
                  ]}
                >
                  <Ionicons name={iconMap[n.type]} size={20} color={colorMap[n.type]} />
                </View>
                <View style={tw`flex-1`}>
                  <View style={tw`flex-row items-center justify-between mb-0.5`}>
                    <Text style={tw`text-[#0F172A] font-bold text-sm`}>{n.title}</Text>
                    {!n.read && <View style={tw`w-2 h-2 rounded-full bg-[#2563EB]`} />}
                  </View>
                  <Text style={tw`text-gray-500 text-xs leading-relaxed`}>{n.body}</Text>
                  <Text style={tw`text-gray-400 text-[10px] mt-1.5`}>
                    {n.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ))}
            <TouchableOpacity onPress={clear} style={tw`items-center mt-2`}>
              <Text style={tw`text-gray-400 text-xs`}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ── Main Home screen ─────────────────────────────────────────────────────────
export default function EmployeeHome() {
  const { user } = useAuthStore();
  const { notifications, push, markAllRead } = useNotificationStore();
  const router = useRouter();

  const [source, setSource] = useState(user?.home_area || 'BTM Layout');
  const [destination, setDestination] = useState('Whitefield Tech Park');
  const [date, setDate] = useState('Today, 8:30 AM');
  const [passengers, setPassengers] = useState('1');

  const [isLocationModalVisible, setLocationModalVisible] = useState(false);
  const [locationFieldType, setLocationFieldType] = useState<'source' | 'destination'>('source');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifVisible, setNotifVisible] = useState(false);

  const badge = unreadCount(notifications);

  // Fix stale source when user loads async after mount
  useEffect(() => {
    if (user?.home_area && user.home_area !== source) setSource(user.home_area);
  }, [user?.home_area]);

  // Subtle car float animation
  const carY = useSharedValue(0);
  useEffect(() => {
    carY.value = withRepeat(
      withSequence(withTiming(-5, { duration: 1200, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: 1200, easing: Easing.inOut(Easing.ease) })),
      -1, true,
    );
  }, []);
  const carStyle = useAnimatedStyle(() => ({ transform: [{ translateY: carY.value }] }));

  const handleSearch = () =>
    router.push({ pathname: '/(employee)/search', params: { source, destination, date, passengers } });

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

  const showComingSoon = (f: string) =>
    Alert.alert('Coming Soon', `${f} is currently under development.`);

  const handleSOS = () => {
    Alert.alert(
      'Emergency SOS',
      'This will send an emergency alert to company security and share your location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS', style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/safety/sos', { description: 'SOS triggered from home screen' });
              push({ type: 'sos', title: 'SOS Sent', body: 'Your emergency alert has been received by company security.' });
              Alert.alert('SOS Sent', 'Company security has been alerted. Help is on the way.');
            } catch {
              Alert.alert('SOS Logged Locally', 'Network error — call emergency services directly.\n\n📞 Emergency: 112');
            }
          },
        },
      ],
    );
  };

  const filteredLocations = LOCATIONS.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F0F4FF] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <ScrollView contentContainerStyle={tw`flex-grow pb-8`} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={tw`bg-white px-5 pt-4 pb-4 flex-row justify-between items-center shadow-sm`}>
          <View style={tw`flex-row items-center`}>
            <View style={tw`mr-3`}><Logo size="small" /></View>
            <View>
              <Text style={tw`text-gray-400 text-xs font-medium`}>Good morning,</Text>
              <Text style={tw`text-[#0F172A] text-lg font-bold`}>{user?.name}</Text>
            </View>
          </View>
          <View style={tw`flex-row items-center gap-2`}>
            <TouchableOpacity
              style={tw`relative w-11 h-11 items-center justify-center`}
              onPress={() => { markAllRead(); setNotifVisible(true); }}
              accessibilityRole="button" accessibilityLabel="Notifications"
            >
              <Ionicons name="notifications-outline" size={24} color="#0F172A" />
              {badge > 0 && (
                <View style={tw`absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full items-center justify-center px-1 border border-white`}>
                  <Text style={tw`text-white text-[9px] font-bold`}>{badge > 9 ? '9+' : badge}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(employee)/profile')}
              style={tw`w-11 h-11 bg-blue-50 rounded-full items-center justify-center border border-blue-100`}
              accessibilityRole="button" accessibilityLabel="Profile"
            >
              <Ionicons name="person" size={20} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Premium Hero — deep navy → blue gradient ── */}
        <View style={tw`bg-[#0F172A] px-6 py-10 items-center relative overflow-hidden`}>
          {/* Subtle glow blob */}
          <View style={tw`absolute -top-10 -right-10 w-48 h-48 bg-[#2563EB] opacity-20 rounded-full`} />
          <View style={tw`absolute bottom-0 -left-8 w-32 h-32 bg-[#3B82F6] opacity-10 rounded-full`} />

          <Animated.View style={[
            tw`w-20 h-20 bg-[#1E3A5F] rounded-full items-center justify-center mb-5 border border-[#2563EB] border-opacity-40`,
            carStyle,
          ]}>
            <Ionicons name="car-sport" size={38} color="#60A5FA" />
          </Animated.View>

          <Text style={tw`text-white text-2xl font-bold mb-1 text-center tracking-tight`}>
            Find trusted rides to work.
          </Text>
          <Text style={tw`text-blue-300 text-sm text-center font-medium`}>
            See who's going your way before you book.
          </Text>
        </View>

        {/* ── Search Card ── */}
        <View style={tw`px-4 -mt-5`}>
          <View style={tw`bg-white rounded-2xl p-5 shadow-lg border border-gray-100`}>
            <View style={tw`flex-row items-center mb-4`}>
              <View style={tw`items-center mr-3`}>
                <View style={tw`w-3 h-3 rounded-full bg-[#2563EB]`} />
                <View style={tw`w-px h-8 bg-gray-200 my-1`} />
                <View style={tw`w-3 h-3 rounded-full bg-[#22C55E]`} />
              </View>
              <View style={tw`flex-1`}>
                <TouchableOpacity
                  onPress={() => openLocationSearch('source')}
                  style={tw`border-b border-gray-100 py-3 mb-2`}
                >
                  <Text style={tw`${source ? 'text-[#0F172A] font-semibold' : 'text-gray-400'} text-base`}>
                    {source || 'Leaving from'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openLocationSearch('destination')}
                  style={tw`border-b border-gray-100 py-3`}
                >
                  <Text style={tw`${destination ? 'text-[#0F172A] font-semibold' : 'text-gray-400'} text-base`}>
                    {destination || 'Going to'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={tw`flex-row justify-between mb-5`}>
              <View style={tw`flex-row items-center border-b border-gray-100 py-2 flex-1 mr-4`}>
                <Ionicons name="time-outline" size={16} color="#94a3b8" style={tw`mr-2`} />
                <TextInput
                  style={tw`text-[#0F172A] flex-1 font-medium text-sm`}
                  value={date} onChangeText={setDate}
                  accessibilityLabel="Departure time"
                />
              </View>
              <View style={tw`flex-row items-center border-b border-gray-100 py-2 w-20`}>
                <Ionicons name="people-outline" size={16} color="#94a3b8" style={tw`mr-2`} />
                <TextInput
                  style={tw`text-[#0F172A] flex-1 font-medium text-sm`}
                  value={passengers} keyboardType="number-pad"
                  onChangeText={setPassengers}
                  accessibilityLabel="Passenger count"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSearch}
              style={tw`bg-[#2563EB] py-4 rounded-xl flex-row justify-center items-center`}
              accessibilityRole="button" accessibilityLabel="Search rides"
            >
              <Text style={tw`text-white font-bold text-base mr-2`}>Search Rides</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Explore ── */}
        <View style={tw`px-5 mt-8`}>
          <Text style={tw`text-[#0F172A] font-bold text-base mb-4 tracking-wide`}>Quick Actions</Text>
          <View style={tw`flex-row justify-between gap-3`}>
            <TouchableOpacity
              style={tw`bg-white flex-1 rounded-2xl p-4 items-center shadow-sm border border-gray-100`}
              onPress={() => router.push('/(employee)/create')}
              accessibilityRole="button" accessibilityLabel="Publish a ride"
            >
              <View style={tw`bg-orange-50 w-12 h-12 rounded-full items-center justify-center mb-3`}>
                <Ionicons name="add" size={24} color="#ea580c" />
              </View>
              <Text style={tw`text-sm text-[#0F172A] font-semibold`}>Publish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-white flex-1 rounded-2xl p-4 items-center shadow-sm border border-gray-100`}
              onPress={() => router.push('/(employee)/map')}
              accessibilityRole="button" accessibilityLabel="Live map"
            >
              <View style={tw`bg-blue-50 w-12 h-12 rounded-full items-center justify-center mb-3`}>
                <Ionicons name="map" size={24} color="#2563EB" />
              </View>
              <Text style={tw`text-sm text-[#0F172A] font-semibold`}>Live Map</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={tw`bg-white flex-1 rounded-2xl p-4 items-center shadow-sm border border-red-50`}
              onPress={handleSOS}
              accessibilityRole="button" accessibilityLabel="Emergency SOS"
            >
              <View style={tw`bg-red-50 w-12 h-12 rounded-full items-center justify-center mb-3`}>
                <Ionicons name="shield-half" size={24} color="#dc2626" />
              </View>
              <Text style={tw`text-sm text-red-600 font-semibold`}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Usual route ── */}
        <View style={tw`px-5 mt-7`}>
          <Text style={tw`text-[#0F172A] font-bold text-base mb-3`}>Your usual route</Text>
          <View style={tw`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex-row items-center justify-between`}>
            <View style={tw`flex-1 mr-3`}>
              <Text style={tw`text-[#0F172A] font-semibold text-sm`} numberOfLines={1}>
                {source} → {destination}
              </Text>
              <Text style={tw`text-gray-400 text-xs mt-0.5`}>
                {user?.usual_start_time ? `Usually around ${user.usual_start_time}` : 'Your regular route'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSearch}
              style={tw`bg-[#EFF6FF] px-4 py-2 rounded-lg border border-blue-100`}
              accessibilityRole="button" accessibilityLabel="Search usual route"
            >
              <Text style={tw`text-[#2563EB] font-bold text-sm`}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* ── Notification panel modal ── */}
      <NotificationPanel visible={notifVisible} onClose={() => setNotifVisible(false)} />

      {/* ── Location picker ── */}
      <Modal visible={isLocationModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={tw`flex-1 bg-white pt-${Platform.OS === 'android' ? '8' : '0'}`}>
          <View style={tw`px-4 py-4 flex-row items-center border-b border-gray-100`}>
            <TouchableOpacity
              onPress={() => setLocationModalVisible(false)}
              style={tw`mr-3 w-9 h-9 items-center justify-center`}
              accessibilityRole="button" accessibilityLabel="Close"
            >
              <Ionicons name="close" size={26} color="#0F172A" />
            </TouchableOpacity>
            <TextInput
              style={tw`flex-1 bg-[#F1F5F9] border border-gray-200 rounded-xl px-4 py-3 text-sm text-[#0F172A]`}
              placeholder={locationFieldType === 'source' ? 'Where from?' : 'Where to?'}
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              accessibilityLabel="Search location"
            />
          </View>
          <ScrollView contentContainerStyle={tw`p-4`}>
            <Text style={tw`text-gray-400 font-semibold text-xs mb-4 ml-1 uppercase tracking-wider`}>
              Suggested
            </Text>
            {filteredLocations.map((loc, idx) => (
              <TouchableOpacity
                key={idx}
                style={tw`flex-row items-center p-3 mb-1 rounded-xl active:bg-gray-50`}
                onPress={() => selectLocation(loc.name)}
                accessibilityRole="button" accessibilityLabel={loc.name}
              >
                <View style={tw`bg-gray-100 w-10 h-10 rounded-full items-center justify-center mr-4`}>
                  <Ionicons name="location" size={18} color="#64748b" />
                </View>
                <View>
                  <Text style={tw`text-base font-semibold text-[#0F172A]`}>{loc.name}</Text>
                  <Text style={tw`text-gray-400 text-xs`}>Bangalore, Karnataka</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

