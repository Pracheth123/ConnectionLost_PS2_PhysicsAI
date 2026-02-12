import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text, Sphere } from "@react-three/drei";

const PhysicsObject3D = ({ config, isPlaying, time }) => {
  const meshRef = useRef();

  // This runs 60 times per second to update position
  useFrame(() => {
    if (!meshRef.current) return;

    // Current time in the simulation
    const t = isPlaying ? time : 0;

    // PHYSICS FORMULA: p = p0 + v0*t + 0.5*a*t^2
    const x = config.start_x + config.velocity_x * t + 0.5 * config.acceleration_x * (t * t);
    const y = config.start_y + config.velocity_y * t + 0.5 * config.acceleration_y * (t * t);
    const z = config.start_z + config.velocity_z * t + 0.5 * config.acceleration_z * (t * t);

    // Apply calculated position to the 3D object
    meshRef.current.position.set(x, y, z);
  });

  return (
    <group ref={meshRef} position={[config.start_x, config.start_y, config.start_z]}>
      {/* The Object (Simple Dot/Sphere) */}
      <Sphere args={[0.3, 32, 32]}>
        <meshStandardMaterial color={config.color || "hotpink"} />
      </Sphere>

      {/* The Label */}
      <Text position={[0, 0.6, 0]} fontSize={0.3} color="black" anchorX="center" anchorY="middle">
        {config.label}
      </Text>
    </group>
  );
};

export default PhysicsObject3D;