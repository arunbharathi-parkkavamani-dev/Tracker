import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const axiosInstance = axios.create({
  baseURL: "https://tracker-mxp9.onrender.com/api",
  timeout: 1000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,   // <-- important fix
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  console.log("TOKEN SENT →", token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
