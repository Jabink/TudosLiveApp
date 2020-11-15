require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const io = socket(server);
const path = require("path");
const rooms = {};

io.on("connection", (socket) => {
  socket.on("new-message", (data) => {
    data.userID = socket.id;
    io.to(data.hostId).emit("new-message", data);
    console.log("new-message");
  });
  socket.on("unMute", (userID) => {
    io.to(userID).emit("unMute");
  });
  socket.on("replyMsg", (data) => {
    io.to(data.userID).emit("replyMsg",data);
    console.log("replyMsg", data);
  });

  socket.on("create room", (roomId) => {
    socket.type = "host";
    socket.roomId = roomId;
    socket.join(roomId);
    rooms[roomId] = socket.id;
    console.log("create room");
  });

  socket.on("join room", (roomId) => {
    if (rooms[roomId]) {
      socket.join(roomId);
      socket.roomId = roomId;
      socket.emit("hostId", rooms[roomId]);
      console.log("join room");
    } else {
      socket.emit("no room");
      console.log("no room");
    }
  });

  socket.on("offer", (data) => {
    data.from = socket.id;
    console.log("Offer");
    io.to(data.to).emit("offer", data);
    console.log("offer");
  });
  socket.on("answer", (data) => {
    data.from = socket.id;
    console.log("answer");
    io.to(data.to).emit("answer", data);
    console.log("answer");
  });

  socket.on("ice-candidate", (data) => {
    data.from = socket.id;
    io.to(data.to).emit("ice-candidate", {
      val: data.candidate,
      userID: socket.id,
    });
  });

  socket.on("disconnect", () => {
    if (socket.roomId) {
      if (socket.type == "host") {
        io.to(socket.roomId).emit("host left");
        rooms[socket.roomId] = null;
      } else {
        io.to(socket.roomId).emit("user left", socket.id);
      }
    }
    console.log("disconnect");
  });
});

if (process.env.PROD) {
  app.use(express.static(path.join(__dirname, "./client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/build/index.html"));
  });
}

const port = process.env.PORT || 8000;
server.listen(port, () => console.log(`Server running on ${port}`));
