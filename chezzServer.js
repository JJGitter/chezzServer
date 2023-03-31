import { Server } from "socket.io";

const io = new Server(9000, {
  cors: { origin: ["http://localhost:3000"] },
});

io.on("connection", (socket) => {
  console.log("Someone connected with socket id: " + socket.id);
  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });

  socket.on("join_room", (roomID) => {
    //check if there are other clients in the room
    const clientsInRoom = io.sockets.adapter.rooms.get(roomID);
    socket.join(roomID);
    if (clientsInRoom && clientsInRoom.size > 0) {
      //if there are more than 1 person in the room, jump both players to Game screen.
      io.sockets.in(roomID).emit("second_user_joined");
      console.log("There are other clients in the room");
    } else {
      console.log("This is the first client in the room");
    }

    console.log(`User with ID: ${socket.id} joined room: ${roomID}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });
});
