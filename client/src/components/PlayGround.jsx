/* this is a test */

import { useRef, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  useProgress,
  Html,
  Environment,
  Stats,
} from "@react-three/drei";
import * as THREE from "three";

import king from "../assets/chess-pieces/chess-0x-king.glb";
import qween from "../assets/chess-pieces/chess-0x-qween.glb";
import bishop from "../assets/chess-pieces/chess-0x-bishop.glb";
import knight from "../assets/chess-pieces/chess-0x-knight.glb";
import rock from "../assets/chess-pieces/chess-0x-rock.glb";
import pawn from "../assets/chess-pieces/chess-0x-pawn.glb";
import board from "../assets/chess-pieces/chess-0x-board.glb";

import brownPhotoStudio from "../assets/hdr/brown_photostudio_02_1k.hdr";

const log = console.log;
const BG_COLOR = 0x222222;

function Loader() {
  const { progress } = useProgress();
  return (
    <Html center>
      <p> {progress.toFixed(1)}%</p>
    </Html>
  );
}

function ChessModel({ url }) {
  const { scene } = useGLTF(url);
  const ref = useRef();
  const { camera, controls } = useThree();

  function handleTest(e) {
    e.stopPropagation();
    if (e.object) {
      const objectName = e.object.name || "Unnamed Object";
      log(`Clicked object: ${objectName}`);
      // log(e.object);
    }
  }

  useEffect(() => {
    let box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    let fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 1.5;

    camera.position.set(center.x, center.y + maxDim / 2, center.z + cameraZ);
    camera.lookAt(center);

    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
  }, [scene, camera, controls]);

  return <primitive object={scene} ref={ref} onPointerDown={handleTest} />;
}

export default function PlayGround() {
  return (
    <div className="debbug" style={{ width: "500px", height: "500px" }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ fov: 75, near: 0.1, far: 1000 }}
        performance={{ min: 0.5, max: 1 }}
      >
        <Suspense fallback={<Loader />}>
          <Environment files={brownPhotoStudio} background />
          <Stats showPanel={false} />

          <directionalLight
            castShadow
            intensity={2}
            position={[0, 5, 10]}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-bias={-0.0001}
            shadow-normalBias={0.05}
          />

          <ChessModel url={board} />
        </Suspense>
        <OrbitControls
          enableDamping
          enablePan={false}
          minDistance={0.15}
          maxDistance={.5}
          maxPolarAngle={Math.PI / 2}
          makeDefault
        />
      </Canvas>
    </div>
  );
}

useGLTF.preload(king);
useGLTF.preload(qween);
useGLTF.preload(bishop);
useGLTF.preload(knight);
useGLTF.preload(rock);
useGLTF.preload(pawn);
useGLTF.preload(board);
