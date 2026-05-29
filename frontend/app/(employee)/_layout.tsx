import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import tw from 'twrnc';

export default function EmployeeLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#16a34a',
      tabBarInactiveTintColor: '#9ca3af',
      tabBarStyle: tw`bg-white border-t border-gray-100 h-16 pb-2 pt-2`,
      headerShown: false,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{
          title: 'Live Map',
          tabBarIcon: ({ color }) => <Ionicons name="map" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="bookings" 
        options={{
          title: 'Rides',
          tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />
        }} 
      />
      
      {/* Hide internal routes from bottom nav */}
      <Tabs.Screen 
        name="ride/[id]" 
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }} 
      />
      <Tabs.Screen 
        name="pooler/[id]" 
        options={{
          href: null,
          tabBarStyle: { display: 'none' }
        }} 
      />
    </Tabs>
  );
}
