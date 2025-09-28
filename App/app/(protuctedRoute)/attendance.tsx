import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { useAuth } from "@/context/AuthContext";

interface AttendanceRecord {
  _id: string;
  checkIn?: string;
  checkOut?: string;
  location?: { latitude: number; longitude: number };
}

const AttendancePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [mockDB, setMockDB] = useState<AttendanceRecord | null>(null); // mock storage

  // Get current location
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Allow location access to continue");
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    return location.coords;
  };

  // Load today's attendance
  const fetchTodayAttendance = () => {
    setTodayRecord(mockDB); // use mock DB for demo
  };

  // Check-in
  const handleCheckIn = async () => {
    if (!user) return;
    setLoading(true);

    const coords = await getLocation();
    if (!coords) return setLoading(false);

    const record: AttendanceRecord = {
      _id: Date.now().toString(),
      checkIn: new Date().toISOString(),
      location: { latitude: coords.latitude, longitude: coords.longitude },
    };
    setMockDB(record);
    setTodayRecord(record);
    Alert.alert("Success", "Checked in!");
    setLoading(false);
  };

  // Check-out
  const handleCheckOut = async () => {
    if (!todayRecord) return;
    setLoading(true);

    const coords = await getLocation();
    if (!coords) return setLoading(false);

    const updatedRecord: AttendanceRecord = {
      ...todayRecord,
      checkOut: new Date().toISOString(),
      location: { latitude: coords.latitude, longitude: coords.longitude },
    };
    setMockDB(updatedRecord);
    setTodayRecord(updatedRecord);
    Alert.alert("Success", "Checked out!");
    setLoading(false);
  };

  // Initial load
  useEffect(() => {
    if (!authLoading && user) fetchTodayAttendance();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Please log in</Text>
      </View>
    );
  }

  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
        Welcome, {user.name}
      </Text>

      {!hasCheckedIn ? (
        <TouchableOpacity
          onPress={handleCheckIn}
          style={{
            backgroundColor: "blue",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            width: 200,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Check In</Text>
        </TouchableOpacity>
      ) : (
        <View
          style={{
            width: 250,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 10,
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          <Text>
            Checked In:{" "}
            {todayRecord.checkIn
              ? new Date(todayRecord.checkIn).toLocaleTimeString()
              : "N/A"}
          </Text>
        </View>
      )}

      {hasCheckedIn && !hasCheckedOut && (
        <TouchableOpacity
          onPress={handleCheckOut}
          style={{
            backgroundColor: "green",
            padding: 15,
            borderRadius: 10,
            marginBottom: 10,
            width: 200,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>Check Out</Text>
        </TouchableOpacity>
      )}

      {hasCheckedOut && (
        <View
          style={{
            width: 250,
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 10,
            marginBottom: 10,
            alignItems: "center",
          }}
        >
          <Text>
            Checked Out:{" "}
            {todayRecord.checkOut
              ? new Date(todayRecord.checkOut).toLocaleTimeString()
              : "N/A"}
          </Text>
        </View>
      )}

      {todayRecord?.location && (
        <MapView
          style={{ width: 300, height: 300, marginTop: 20 }}
          initialRegion={{
            latitude: todayRecord.location.latitude,
            longitude: todayRecord.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: todayRecord.location.latitude,
              longitude: todayRecord.location.longitude,
            }}
            title="Your Location"
            description={`Lat: ${todayRecord.location.latitude}, Lon: ${todayRecord.location.longitude}`}
          />
        </MapView>
      )}
    </ScrollView>
  );
};

export default AttendancePage;
