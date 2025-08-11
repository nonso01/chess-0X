const express = require("express");
const cors = require("cors");

const log = console.log;

const app = express();
const port = 3000;

// app.use(express.static("../client/src"))

app.get("/", (req, res) => {
  res.send("Hello chess-0X");
});

app.listen(port, () => {
  log(`server running at http://localhost:${port}`);
});
