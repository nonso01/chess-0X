import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Environment,
  Html,
  useProgress,
} from "@react-three/drei";
import * as THREE from "three";

// models
import king from "../assets/chess-pieces/chess-0x-king.glb";
import queen from "../assets/chess-pieces/chess-0x-queen.glb";
import bishop from "../assets/chess-pieces/chess-0x-bishop.glb";
import knight from "../assets/chess-pieces/chess-0x-knight.glb";
import rook from "../assets/chess-pieces/chess-0x-rook.glb";
import pawn from "../assets/chess-pieces/chess-0x-pawn.glb";
import board from "../assets/chess-pieces/chess-0x-board.glb";

import brownPhotoStudio from "../assets/hdr/brown_photostudio_02_1k.hdr";

const log = console.log;

const FIND_SQUARE_POS = /^[a-h][1-8]$/i;
const LOWER_CASE_CODE = 97;

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <p style={{ color: "white" }}>{progress.toFixed(1)}%</p>
    </Html>
  );
}

/* ChessModel now wraps the cloned model inside a group.
   rotation is applied to the group (array [x,y,z] in radians).
*/
function ChessModel({
  url,
  worldPosition = null,
  color = 0xffffff,
  scale = 1,
  rotation = [0, 0, 0],
}) {
  const { scene } = useGLTF(url);

  // clone once per model for performance
  const clone = useMemo(() => scene.clone(true), [scene]);

  // apply lightweight material override
  useEffect(() => {
    clone.traverse((c) => {
      if (c.isMesh) {
        c.material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.2,
          metalness: 0.05,
        });
        c.castShadow = true;
        c.receiveShadow = true;
      }
    });
  }, [clone, color]);

  const pos = worldPosition
    ? worldPosition instanceof THREE.Vector3
      ? [worldPosition.x, worldPosition.y, worldPosition.z]
      : worldPosition
    : [0, 0, 0];

  return (
    <group position={pos} rotation={rotation} scale={scale}>
      {/* primitive inside group so group's transform is applied cleanly */}
      <primitive object={clone} />
    </group>
  );
}

// Board component (unchanged behaviour)
function BoardModel({ setSquareWorldPositions }) {
  const { scene } = useGLTF(board);
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) return;

    // Make board meshes receive shadows
    ref.current.traverse((c) => {
      if (c.isMesh) {
        c.receiveShadow = true;
      }
    });

    ref.current.updateMatrixWorld(true);

    const positions = {};
    ref.current.traverse((obj) => {
      if (FIND_SQUARE_POS.test(obj.name)) {
        const wp = new THREE.Vector3();
        obj.getWorldPosition(wp);
        positions[obj.name.toLowerCase()] = wp;
      }
    });

    let squareSize = null;
    if (positions["a1"] && positions["b1"]) {
      squareSize = positions["a1"].distanceTo(positions["b1"]);
    }

    setSquareWorldPositions({ positions, squareSize });
  }, [setSquareWorldPositions, scene]);

  return <primitive ref={ref} object={scene} />;
}

// PieceSet: rotate black knights 90deg on Z
function PieceSet({ squareWorldPositions, yOffset = 0.0, pieceScale = 1 }) {
  if (!squareWorldPositions) return null;
  const { positions } = squareWorldPositions;

  const COLORS = {
    white: 0xC1C1B9,
    black: 0x111011,
  };

  const backRank = [rook, knight, bishop, queen, king, bishop, knight, rook];

  const placements = [
    ...backRank.map((model, i) => [
      String.fromCharCode(LOWER_CASE_CODE + i) + "1",
      model,
      COLORS.white,
    ]),
    ...Array.from({ length: 8 }, (_, i) => [
      String.fromCharCode(LOWER_CASE_CODE + i) + "2",
      pawn,
      COLORS.white,
    ]),
    ...Array.from({ length: 8 }, (_, i) => [
      String.fromCharCode(LOWER_CASE_CODE + i) + "7",
      pawn,
      COLORS.black,
    ]),
    ...backRank.map((model, i) => [
      String.fromCharCode(LOWER_CASE_CODE + i) + "8",
      model,
      COLORS.black,
    ]),
  ];

  return placements.map(([square, model, color], i) => {
    const worldPos = positions[square];
    if (!worldPos) return null;
    const adjusted = worldPos.clone();
    adjusted.y += yOffset;

    // rotate black knight 180deg at y-axis
    const isBlackKnight = model === knight && color === COLORS.black;
    const rotation = isBlackKnight ? [0, Math.PI, 0] : [0, 0, 0];

    return (
      <ChessModel
        key={i}
        url={model}
        worldPosition={adjusted}
        color={color}
        scale={pieceScale}
        rotation={rotation}
      />
    );
  });
}

export default function PlayGround() {
  const [squareWorldPositions, setSquareWorldPositions] = useState(null);

  return (
    <div style={{ width: "500px", height: "500px" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 50, near: 0.1, far: 1000, position: [0, 8, 10] }}
      >
        <Suspense fallback={<Loader />}>
          <Environment files={brownPhotoStudio} background />
          <directionalLight
            castShadow
            intensity={3}
            position={[5, 10, 5]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />

          <BoardModel setSquareWorldPositions={setSquareWorldPositions} />

          <PieceSet
            squareWorldPositions={squareWorldPositions}
            yOffset={0.0}
            pieceScale={1}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          minDistance={0.2}
          maxDistance={1}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
}

// Preload assets
useGLTF.preload(king);
useGLTF.preload(queen);
useGLTF.preload(bishop);
useGLTF.preload(knight);
useGLTF.preload(rook);
useGLTF.preload(pawn);
useGLTF.preload(board);
