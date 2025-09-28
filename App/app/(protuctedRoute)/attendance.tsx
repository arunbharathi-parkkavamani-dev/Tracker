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
import axiosInstance from "@/Api/axiosInstance";

interface AttendanceRecord {
  _id: string;
  checkIn?: string;
  checkOut?: string;
  location?: { latitude: number; longitude: number };
}

const AttendancePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord[] | null>(
   null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split("T")[0];

  // 🔹 Get current location
  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission denied", "Allow location access to continue");
      return null;
    }
    const location = await Location.getCurrentPositionAsync({});
    return location.coords;
  };

  // 🔹 Load today's attendance
  const fetchTodayAttendance = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/populate/read/attendances?employee=${user._id}&date=${today}`,
        { withCredentials: true }
      );
      // console.log(response.data.data)

      if (response?.data?.data) {
        // console.log("record")
        setTodayRecord(response.data.data);
        // console.log(response.data.data)
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error("Failed to fetch today's attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Check-in
  const handleCheckIn = async () => {
    try {
      setLoading(true);
      const coords = await getLocation();
      if (!coords) return setLoading(false);
      await axiosInstance.post(
        `/populate/create/attendances`,
        {
          employee: user.id,
          date: today,
          checkIn: new Date().toISOString(),
          status: "Present",
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        },
        { withCredentials: true }
      );

      Alert.alert("Success", "Checked in successfully");
      await fetchTodayAttendance();
    } catch (err) {
      console.error("Check-in failed:", err);
      Alert.alert("Error", "Unable to check in");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Check-out
  const handleCheckOut = async () => {
    if (!todayRecord) return;

    try {
      setLoading(true);
      const coords = await getLocation();
      if (!coords) return setLoading(false);

      await axiosInstance.put(
        `/populate/update/attendances/${todayRecord[0]._id}`,
        {
          checkOut: new Date().toISOString(),
          location: {
            latitude: coords.latitude,
            longitude: coords.longitude,
          },
        },
        { withCredentials: true }
      );

      Alert.alert("Success", "Checked out successfully");
      await fetchTodayAttendance();
    } catch (err) {
      console.error("Check-out failed:", err);
      Alert.alert("Error", "Unable to check out");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Load attendance on mount
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
  console.log(todayRecord);
  console.log(todayRecord?.[0]?.checkIn)
  const record = todayRecord?.[0];

  const hasCheckedIn = !!record?.checkIn;
  const hasCheckedOut = !!record?.checkOut;

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

      {/* Check-in button */}
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
            {record.checkIn
              ? new Date(record.checkIn).toLocaleTimeString()
              : "N/A"}
          </Text>
        </View>
      )}

      {/* Check-out button */}
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

      {/* Show check-out record */}
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
            {record.checkOut
              ? new Date(record.checkOut).toLocaleTimeString()
              : "N/A"}
          </Text>
        </View>
      )}

      {/* Show location map */}
      {record?.location && (
        <MapView
          style={{ width: 300, height: 300, marginTop: 20 }}
          initialRegion={{
            latitude: record.location.latitude,
            longitude: record.location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{
              latitude: record.location.latitude,
              longitude: record.location.longitude,
            }}
            title="Your Location"
            description={`Lat: ${record.location.latitude}, Lon: ${record.location.longitude}`}
          />
        </MapView>
      )}
    </ScrollView>
  );
};

export default AttendancePage;
