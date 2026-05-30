import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import tw from 'twrnc';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

export default function PublishRide() {
  const router = useRouter();
  const [publishing, setPublishing] = useState(false);

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      Alert.alert('Success', 'Ride published successfully to your Company Circle!', [
        { text: 'OK', onPress: () => router.push('/(employee)/bookings') }
      ]);
    }, 1500);
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-[#F8FAFC] pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <View style={tw`bg-white px-4 py-4 flex-row items-center shadow-sm z-10`}>
        <TouchableOpacity onPress={() => router.back()} style={tw`mr-4 p-2`}>
          <Ionicons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={tw`text-[#0F172A] font-bold text-lg`}>Publish a Ride</Text>
      </View>

      <ScrollView contentContainerStyle={tw`p-6 pb-32`}>
        <Text style={tw`text-lg font-bold text-[#0F172A] mb-4`}>Ride Details</Text>
        
        <View style={tw`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-6`}>
           <View style={tw`border-b border-gray-100 pb-3 mb-3 flex-row items-center`}>
             <Ionicons name="location-outline" size={20} color="#64748b" style={tw`mr-3`} />
             <Text style={tw`text-[#0F172A] font-bold flex-1`}>BTM Layout</Text>
           </View>
           <View style={tw`border-b border-gray-100 pb-3 mb-3 flex-row items-center`}>
             <Ionicons name="flag-outline" size={20} color="#64748b" style={tw`mr-3`} />
             <Text style={tw`text-[#0F172A] font-bold flex-1`}>Whitefield Tech Park</Text>
           </View>
           <View style={tw`flex-row items-center justify-between`}>
             <View style={tw`flex-row items-center`}>
               <Ionicons name="time-outline" size={20} color="#64748b" style={tw`mr-3`} />
               <Text style={tw`text-[#0F172A] font-bold`}>Today, 8:30 AM</Text>
             </View>
             <View style={tw`bg-gray-100 px-3 py-1 rounded-full flex-row items-center`}>
               <Ionicons name="people" size={14} color="#0F172A" style={tw`mr-1.5`} />
               <Text style={tw`text-[#0F172A] font-bold`}>3 seats</Text>
             </View>
           </View>
        </View>

        <Text style={tw`text-lg font-bold text-[#0F172A] mb-2`}>Visibility Mode</Text>
        <Text style={tw`text-gray-500 text-xs mb-4 font-medium`}>Control who can see and request to join your ride.</Text>
       
        <TouchableOpacity style={tw`bg-green-50 border-2 border-[#1d4ed8] rounded-xl p-4 mb-3 flex-row items-center shadow-sm`}>
          <Ionicons name="radio-button-on" size={24} color="#1d4ed8" style={tw`mr-3`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-[#0F172A] font-extrabold text-base mb-0.5`}>Company Circle</Text>
            <Text style={tw`text-green-800 text-xs font-medium`}>Only verified coworkers from your company can view and join.</Text>
          </View>
          <Ionicons name="shield-checkmark" size={20} color="#1d4ed8" />
        </TouchableOpacity>

        <View style={tw`bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center opacity-60`}>
          <Ionicons name="lock-closed" size={20} color="#94a3b8" style={tw`mr-3`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-gray-500 font-bold text-base mb-0.5`}>Partner Network</Text>
            <Text style={tw`text-gray-400 text-xs font-medium`}>Visible to verified employees from approved partner companies. (Requires company approval)</Text>
          </View>
        </View>

        <View style={tw`bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center opacity-60`}>
          <Ionicons name="lock-closed" size={20} color="#94a3b8" style={tw`mr-3`} />
          <View style={tw`flex-1`}>
            <Text style={tw`text-gray-500 font-bold text-base mb-0.5`}>Verified Community</Text>
            <Text style={tw`text-gray-400 text-xs font-medium`}>Visible to verified RouteMate users beyond company networks. (Coming soon)</Text>
          </View>
        </View>

      </ScrollView>

      <View style={tw`absolute bottom-0 w-full bg-white px-6 py-4 border-t border-gray-100 shadow-[0_-4px_6px_rgba(0,0,0,0.05)]`}>
        <TouchableOpacity 
          style={tw`w-full bg-[#22C55E] py-4 rounded-xl items-center shadow-md ${publishing ? 'opacity-70' : ''}`}
          onPress={handlePublish}
          disabled={publishing}
        >
          <Text style={tw`text-white font-bold text-lg`}>{publishing ? 'Publishing...' : 'Publish Ride'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
