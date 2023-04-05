import { Server } from "socket.io";

const io = new Server(9000, {
  cors: { origin: ["http://localhost:3000"] },
});

io.on("connection", (socket) => {
  console.log("Someone connected with socket id: " + socket.id);
  socket.on("disconnect", () => {
    console.log("User Disconnected " + socket.id);
  });

  socket.on("join_room", (roomID) => {
    //check if there are other clients in the room
    const clientsInRoom = io.sockets.adapter.rooms.get(roomID);
    socket.join(roomID);
    if (clientsInRoom && clientsInRoom.size > 0) {
      socket.to(roomID).emit("server_request_for_gameData");
      console.log("There are other clients in the room");
    } else {
      console.log("This is the first client in the room");
    }

    console.log(`User with ID: ${socket.id} joined room: ${roomID}`);
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("gameData_to_server", (room, userColor, selectedTimeControl) => {
    socket.to(room).emit("gameData_to_client", userColor, selectedTimeControl);
  });

  socket.on(
    "piece_moved",
    (room, fromSquare, toSquare, pieceType, pieceColor) => {
      socket
        .to(room)
        .emit("opponent_moved", fromSquare, toSquare, pieceType, pieceColor);
    }
  );

  socket.on("resign", (room, userColor) => {
    socket.to(room).emit("opponent_resigns", userColor);
  });

  socket.on("offer_draw", (room) => {
    socket.to(room).emit("receive_draw_offer");
  });

  socket.on("draw_accepted", (room) => {
    socket.to(room).emit("receive_draw_accepted");
  });
});
