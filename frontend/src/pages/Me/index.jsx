import { useEffect } from "react";
import { io } from "socket.io-client";

export default function TestSocket() {
  useEffect(() => {
    // Connect to backend
    const socket = io("http://10.50.151.208:3000"); // replace with your backend URL

    // Join a user room
    socket.emit("join", "68d8b9daf397d1d97620ba9a"); // your test userId

    // Listen for notifications
    socket.on("notification", (data) => {
      console.log("Received notification:", data);
      alert(`Notification: ${data.message}`); // quick popup
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return <div>Socket Test Running</div>;
}
