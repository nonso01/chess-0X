const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const dotenv = require("dotenv");
dotenv.config();

const log = console.log;
const port = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
// test only
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: "true",
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: "true",
  })
);
app.get("/", (req, res) => {
  res.send("Hello chess-0X");
});

io.on("connection", (socket) => {
  log("a user connected", socket.id);

  socket.on("disconnect", () => {
    log("user disconnected", socket.id);
  });

  socket.emit("server_message", "Hello from the server");
});

server.listen(port, () => {
  log(`server running at http://localhost:${port}`);
});
