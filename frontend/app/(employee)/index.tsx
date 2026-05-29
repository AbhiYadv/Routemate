import { View, Text, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import tw from 'twrnc';
import { useAuthStore } from '../../src/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function EmployeeHome() {
  const { user, logout } = useAuthStore();

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50 pt-${Platform.OS === 'android' ? '8' : '0'}`}>
      <ScrollView contentContainerStyle={tw`flex-grow`}>
        {/* Header */}
        <View style={tw`bg-blue-600 px-6 pt-6 pb-16 rounded-b-3xl relative`}>
          <View style={tw`flex-row justify-between items-center`}>
            <View>
              <Text style={tw`text-blue-100 text-sm`}>Good morning,</Text>
              <Text style={tw`text-white text-2xl font-bold`}>{user?.name}</Text>
            </View>
            <TouchableOpacity onPress={logout} style={tw`bg-blue-500 p-2 rounded-full`}>
              <Ionicons name="log-out-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Card */}
        <View style={tw`px-6 -mt-10`}>
          <View style={tw`bg-white rounded-2xl p-5 shadow-sm border border-gray-100`}>
            <Text style={tw`text-gray-900 font-bold text-lg mb-4`}>Today's Commute</Text>
            
            {user?.home_area ? (
              <View style={tw`flex-row items-center justify-between bg-blue-50 p-4 rounded-xl`}>
                <View style={tw`flex-1`}>
                  <Text style={tw`text-blue-800 font-semibold mb-1`}>To Office</Text>
                  <Text style={tw`text-blue-600 text-sm`}>{user.home_area} → Office</Text>
                </View>
                <TouchableOpacity style={tw`bg-blue-600 px-4 py-2 rounded-lg`}>
                  <Text style={tw`text-white font-bold`}>Find Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={tw`bg-orange-50 p-4 rounded-xl flex-row items-center`}>
                <Ionicons name="alert-circle" size={24} color="#ea580c" style={tw`mr-3`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`text-orange-800 font-semibold`}>Profile Incomplete</Text>
                  <Text style={tw`text-orange-600 text-sm mt-1`}>Set your home and office locations to get ride suggestions.</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={tw`px-6 mt-8`}>
          <Text style={tw`text-gray-900 font-bold text-lg mb-4`}>Quick Actions</Text>
          <View style={tw`flex-row justify-between`}>
            <TouchableOpacity style={tw`bg-white w-[31%] rounded-xl p-4 items-center shadow-sm border border-gray-100`}>
              <View style={tw`bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="car" size={24} color="#0284c7" />
              </View>
              <Text style={tw`text-xs text-gray-700 font-medium text-center`}>Carpool</Text>
            </TouchableOpacity>

            <TouchableOpacity style={tw`bg-white w-[31%] rounded-xl p-4 items-center shadow-sm border border-gray-100`}>
              <View style={tw`bg-green-100 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="bus" size={24} color="#16a34a" />
              </View>
              <Text style={tw`text-xs text-gray-700 font-medium text-center`}>Shuttle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={tw`bg-red-50 w-[31%] rounded-xl p-4 items-center shadow-sm border border-red-100`}>
              <View style={tw`bg-red-100 w-12 h-12 rounded-full items-center justify-center mb-2`}>
                <Ionicons name="shield-half" size={24} color="#dc2626" />
              </View>
              <Text style={tw`text-xs text-red-700 font-bold text-center`}>SOS / Help</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
