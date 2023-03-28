import { Server } from "socket.io";

const io = new Server(9000, {
  cors: { origin: ["http://localhost:3000"] },
});

io.on("connection", (socket) => {
  console.log("Someone connected with socket id: " + socket.id);
  socket.on("custom-event", (number, string, obj) => {
    console.log(number, string, obj);
  });
});
