import { useState, useEffect, lazy } from "react";
import { io } from "socket.io-client";
// import PlayGround from "./components/PlayGround";
// import Welcome from "./components/ui/Welcome";

const log = console.log;

const API_URL = import.meta.env.VITE_API_URL;
const devURL = "http://localhost:3000";

const PlayGround = lazy(() => import("./components/PlayGround"));
const Welcome = lazy(() => import("./components/ui/Welcome"));

function App() {
  // const [msg, setMsg] = useState("");

  function handleSocketConnection() {
    useEffect(() => {
      const socket = io(API_URL);

      socket.on("connect", () => {
        log(`connected to server with id:${socket?.id}`);
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
      <div className="chess-0x w-dvw min-h-dvh bg-(--pc-grey)" id="chess-0x">
        <Welcome />
        <PlayGround width={350} height={350} />
      </div>
    </>
  );
}

export default App;
