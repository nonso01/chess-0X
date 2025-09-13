import { useRef, useState, useEffect, Suspense, useMemo } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
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

// textures
import whiteColor from "../assets/chess-theme-wood/white/user-white-color.jpg";
import blackColor from "../assets/chess-theme-wood/black/user-black-color.jpg";
import pieceRoughness from "../assets/chess-theme-wood/user-roughness.jpg";
import pieceNormal from "../assets/chess-theme-wood/user-normal.jpg";
import pieceAO from "../assets/chess-theme-wood/user-occlusion.jpg";

// HDR
import brownPhotoStudio from "../assets/hdr/brown_photostudio_02_1k.hdr";

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

// Preload textures once & memoize materials
function useChessMaterials() {
  const [wColor, bColor, pRoughness, pNormal, pAO] = useLoader(
    THREE.TextureLoader,
    [whiteColor, blackColor, pieceRoughness, pieceNormal, pieceAO]
  );

  // flip / colorSpace setup
  [wColor, bColor].forEach((t) => {
    t.flipY = false;
    if ("colorSpace" in t) t.colorSpace = THREE.SRGBColorSpace;
    else t.encoding = THREE.sRGBEncoding;
  });
  [pRoughness, pNormal, pAO].forEach((t) => {
    t.flipY = false;
    if ("colorSpace" in t) t.colorSpace = THREE.NoColorSpace;
    else t.encoding = THREE.LinearEncoding;
  });

  const makeMat = (map) =>
    new THREE.MeshStandardMaterial({
      map,
      roughnessMap: pRoughness,
      normalMap: pNormal,
      aoMap: pAO,
      aoMapIntensity: 0.75,
      roughness: 1,
      metalness: 0,
    });

  const whiteMat = useMemo(
    () => makeMat(wColor),
    [wColor, pRoughness, pNormal, pAO]
  );
  const blackMat = useMemo(
    () => makeMat(bColor),
    [bColor, pRoughness, pNormal, pAO]
  );

  return { whiteMat, blackMat };
}

/* ChessModel: apply shared baked materials */
function ChessModel({
  url,
  worldPosition,
  color,
  scale = 1,
  rotation = [0, 0, 0],
  materials,
}) {
  const { scene } = useGLTF(url);
  const clone = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    clone.traverse((c) => {
      if (c.isMesh) {
        c.material?.dispose();
        c.material =
          color === 0xc1c1b9 ? materials.whiteMat : materials.blackMat;
        c.castShadow = true;
        c.receiveShadow = true;

        // ensure aoMap uses UV2
        if (
          c.geometry &&
          c.geometry.attributes.uv &&
          !c.geometry.attributes.uv2
        ) {
          c.geometry.setAttribute("uv2", c.geometry.attributes.uv);
        }
      }
    });
  }, [clone, color, materials]);

  const pos = worldPosition
    ? worldPosition instanceof THREE.Vector3
      ? [worldPosition.x, worldPosition.y, worldPosition.z]
      : worldPosition
    : [0, 0, 0];

  return (
    <group position={pos} rotation={rotation} scale={scale}>
      <primitive object={clone} />
    </group>
  );
}

function BoardModel({ setSquareWorldPositions }) {
  const { scene } = useGLTF(board);
  const ref = useRef();

  // added because of frameloop"demand" in Canvas
  const { invalidate } = useThree();

  useEffect(() => {
    if (!ref.current) return;

    ref.current.traverse((c) => {
      if (c.isMesh) c.receiveShadow = true;
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
    invalidate();
  }, [setSquareWorldPositions, scene, invalidate]);

  return <primitive ref={ref} object={scene} />;
}

function PieceSet({
  squareWorldPositions,
  yOffset = 0.0,
  pieceScale = 1,
  materials,
}) {
  if (!squareWorldPositions) return null;
  const { positions } = squareWorldPositions;

  const COLORS = { white: 0xc1c1b9, black: 0x111011 };
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
        materials={materials}
      />
    );
  });
}

export default function PlayGround({ width = 340, height = 340 }) {
  const [squareWorldPositions, setSquareWorldPositions] = useState(null);
  const materials = useChessMaterials();

  return (
    <div className="play-ground" style={{ width, height }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 50, near: 0.01, far: 500, position: [0, 8, 10] }}
        frameloop="demand"
      >
        <Suspense fallback={<Loader />}>
          <Environment files={brownPhotoStudio} background />
          <directionalLight
            castShadow
            intensity={4}
            position={[5, 10, 15]}
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <BoardModel setSquareWorldPositions={setSquareWorldPositions} />
          <PieceSet
            squareWorldPositions={squareWorldPositions}
            yOffset={0.0}
            pieceScale={1}
            materials={materials}
          />
        </Suspense>

        <OrbitControls
          enablePan={false}
          dampingFactor={0.2}
          minDistance={0.4}
          maxDistance={0.7}
          rotateSpeed={0.5}
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
