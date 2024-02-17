import express from "express";
import { Server } from "socket.io";
import * as http from "http";
import cors from "cors";

const app = express();
const PORT = 3001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.get("/", (req, res) => {
  res.send("<h1>/</h1>");
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });

  function createHandler(name: string) {
    socket.on(name, (data) => {
      socket.to(data.room).emit(name, data.message);
    });
  }

  socket.on("joinRoom", (data) => {
    socket.join(data);
  });

  socket.on("leaveRoom", (data) => {
    socket.leave(data);
  });
});

app.listen(PORT, () => console.log("started: " + PORT));
