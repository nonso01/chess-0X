import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import PlayGround from "./components/PlayGround";

const log = console.log;

function App() {
  const [msg, setMsg] = useState("");
  
  function handleSocketConnection() {
    useEffect(() => {
      const socket = io("http://localhost:3000");

      socket.on("connect", () => {
        log(`connected to server with id:${socket?.id}`);
      });
      socket.on("disconnect", () => {
        log("disconnected from the server");
      });

      socket.on("server_message", (data) => {
        log(`message from server:${data}`);
        setMsg(data);
      });

      return () => {
        socket.disconnect();
      };
    }, []);
  }

  handleSocketConnection();

  return (
    <>
      <h1 className="read-the-docs">Welcome to chess-0X</h1>
      <PlayGround />
    </>
  );
}

export default App;
