import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://10.16.80.167:3000/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export default axiosInstance;
