import { Server } from "socket.io";

// const io = new Server(9000, {
//   cors: { origin: ["http://localhost:3000"] },
// });
// const io = new Server({
//   cors: { origin: ["https://jjgitter.github.io/chezz/"] },
// });
const io = new Server({
  cors: { origin: "*", methods: ["GET", "POST"] },
});
//point to https://jjgitter.github.io/chezz/ with no port
let timerInterval;
let whiteTime;
let blackTime;
let gameList = [];
let roomID = 0;

io.listen(process.env.PORT || 9000, () => {
  console.log("server is running");
  console.log("port=" + process.env.PORT);
});

io.on("connection", (socket) => {
  console.log("Someone connected with socket id: " + socket.id);
  socket.emit("existing_gameList_from_server", gameList);
  socket.on("disconnect", () => {
    gameList = gameList.filter((game) => game.key !== socket.id);
    io.sockets.emit("existing_gameList_from_server", gameList);
    console.log("User Disconnected " + socket.id);
  });

  socket.on("create_game", (user, timeControl) => {
    roomID++;
    socket.join(roomID);
    let game = {
      key: socket.id,
      createdBy: user,
      timeControl: timeControl,
      room: roomID,
    };
    gameList.push(game);
    socket.broadcast.emit("game_was_created", gameList);

    console.log(`User with ID: ${socket.id} joined room: ${roomID}`);
  });

  socket.on("join_game_request", (room) => {
    socket.join(room);

    //As the game is full, remove the game from gameList in server and clients.
    //------------
    gameList.filter((game) => game.room !== room);
    io.sockets.emit("existing_gameList_from_server", gameList);
    //------------
    socket.to(room).emit("server_request_for_gameData");
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", (data) => {
    let room = Array.from(socket.rooms)[1];
    socket.to(room).emit("receive_message", data);
  });

  socket.on("gameData_to_server", (userColor, selectedTimeControl, FEN) => {
    let room = Array.from(socket.rooms)[1];
    console.log("sending gameData to 2nd client via room" + room);

    socket
      .to(room)
      .emit("gameData_to_client", userColor, selectedTimeControl, FEN);
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

  socket.on("piece_moved", (fromSquare, toSquare, pieceType, pieceColor) => {
    let room = Array.from(socket.rooms)[1];
    console.log("piece moved");
    provideTimeToClients(pieceColor, room);
    socket
      .to(room)
      .emit("opponent_moved", fromSquare, toSquare, pieceType, pieceColor);
  });

  socket.on("resign", (userColor) => {
    let room = Array.from(socket.rooms)[1];
    socket.to(room).emit("opponent_resigns", userColor);
    clearInterval(timerInterval);
  });

  socket.on("offer_draw", () => {
    let room = Array.from(socket.rooms)[1];
    socket.to(room).emit("receive_draw_offer");
  });

  socket.on("draw_accepted", () => {
    let room = Array.from(socket.rooms)[1];
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
