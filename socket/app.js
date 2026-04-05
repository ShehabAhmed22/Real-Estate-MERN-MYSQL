import { Server } from "socket.io";

const io = new Server({
  cors: {
    origin: "http://localhost:5173",
  },
});

let onlineUsers = [];

const addUser = (userId, socketId) => {
  if (!onlineUsers.some((u) => u.userId === userId)) {
    onlineUsers.push({ userId, socketId });
  }
};

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((u) => u.socketId !== socketId);
};

const getUser = (userId) => {
  return onlineUsers.find((u) => u.userId === userId);
};

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  socket.on("newUser", (userId) => {
    addUser(userId, socket.id);
    console.log("👤 Users:", onlineUsers);
  });

  socket.on("sendMessage", ({ receiverId, data }) => {
    const receiver = getUser(receiverId);

    if (receiver) {
      io.to(receiver.socketId).emit("getMessage", data);
    } else {
      console.log("❌ Receiver offline");
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Disconnected:", socket.id);
    removeUser(socket.id);
  });
});

io.listen(4000, () => {
  console.log("🚀 Socket running on 4000");
});
