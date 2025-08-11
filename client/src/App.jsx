import { useState } from "react";
import PlayGround from "./components/PlayGround";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <h1 className="read-the-docs">Welcome to chess-0X</h1>

      <PlayGround />
    </>
  );
}

export default App;
