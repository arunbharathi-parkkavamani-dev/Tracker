import { Server } from "socket.io";

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log("User connected", socket.id);

  // Join room for user-specific notifications
  socket.on("join", (userId) => {
    socket.join(userId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });
});
