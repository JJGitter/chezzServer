import { Server } from "socket.io";

const io = new Server(9000, {
  cors: { origin: ["http://localhost:3000"] },
});
let timerInterval;
let whiteTime;
let blackTime;

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
    switch (selectedTimeControl) {
      case "classical":
        whiteTime = 1800;
        blackTime = 1800;
        break;
      case "rapid":
        whiteTime = 600;
        blackTime = 600;
        break;
      case "blitz":
        whiteTime = 180;
        blackTime = 180;
        break;
      default:
        whiteTime = 60;
        blackTime = 60;
    }
  });

  socket.on(
    "piece_moved",
    (room, fromSquare, toSquare, pieceType, pieceColor) => {
      provideTimeToClients(pieceColor, room);
      socket
        .to(room)
        .emit("opponent_moved", fromSquare, toSquare, pieceType, pieceColor);
    }
  );

  socket.on("resign", (room, userColor) => {
    socket.to(room).emit("opponent_resigns", userColor);
    clearInterval(timerInterval);
  });

  socket.on("offer_draw", (room) => {
    socket.to(room).emit("receive_draw_offer");
  });

  socket.on("draw_accepted", (room) => {
    socket.to(room).emit("receive_draw_accepted");
    clearInterval(timerInterval);
  });
});

function provideTimeToClients(pieceColor, room) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (pieceColor === "white") {
      blackTime = blackTime - 1;
    } else {
      whiteTime = whiteTime - 1;
    }
    io.sockets.to(room).emit("time_from_server", whiteTime, blackTime);
    if (blackTime === 0 || whiteTime === 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
}

