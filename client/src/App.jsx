import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import PlayGround from "./components/PlayGround";

const log = console.log;

const API_URL = import.meta.env.VITE_API_URL;
const devURL = "http://localhost:3000";

function App() {
  const [msg, setMsg] = useState("");

  function handleSocketConnection() {
    useEffect(() => {
      const socket = io(API_URL);

      socket.on("connect", () => {
        log(`connected to server with id:${socket?.id}`);
         setMsg(socket?.id);
      });
      socket.on("disconnect", () => {
        log("disconnected from the server");
      });

      socket.on("server_message", (data) => {
        log(`message from server:${data}`);
      });

      return () => {
        socket.disconnect();
      };
    }, []);
  }

  handleSocketConnection();

  return (
    <>
      {/* <h1 className="read-the-docs">Welcome to chess-0X</h1> */}
      <h1>TESTS....</h1>
      <p>welcome user: {msg ? msg : "loading.."}</p>
      <PlayGround />
    </>
  );
}

export default App;
