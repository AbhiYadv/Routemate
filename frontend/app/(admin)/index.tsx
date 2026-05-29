import { View, Text, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../src/store/auth';
export default function AdminHome() { 
  const logout = useAuthStore(s => s.logout);
  return <View style={{padding: 50}}><Text>Admin Dashboard</Text><TouchableOpacity onPress={logout}><Text>Logout</Text></TouchableOpacity></View>; 
}