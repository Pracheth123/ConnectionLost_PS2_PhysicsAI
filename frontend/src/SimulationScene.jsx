import React, { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Sphere, Box, Text, Trail, Line } from "@react-three/drei";
import * as THREE from "three";

// --- VISUALS ---
const CarVisual = ({ args, color }) => {
  const [w, h, d] = args || [4, 2, 6];
  const wheelRadius = h / 2.5;
  return (
    <group>
      <Box args={[w, h, d]}>
        <meshStandardMaterial color={color || "blue"} roughness={0.2} metalness={0.6} />
      </Box>
      <group position={[0, -h/2, 0]}>
        {[ [1,1], [-1,1], [1,-1], [-1,-1] ].map(([kx, kz], i) => (
            <mesh key={i} position={[kx*(w/2), 0, kz*(d/2 - 0.5)]} rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[wheelRadius, wheelRadius, 0.5, 16]} />
                <meshStandardMaterial color="black" />
            </mesh>
        ))}
      </group>
    </group>
  );
};

const WedgeVisual = ({ args, color }) => {
    return (
        <Box args={args}>
            <meshStandardMaterial color={color || "orange"} />
        </Box>
    )
}

// --- GHOST TRAJECTORY ---
const GhostTrajectory = ({ data, gravityMode, customGravity }) => {
    const points = useMemo(() => {
        if (data.fixed) return [];
        
        const path = [];
        const pos = new THREE.Vector3(...data.pos);
        const vel = new THREE.Vector3(...(data.vel || [0,0,0]));
        const dt = 0.05; 
        const steps = 150; 
        const g = gravityMode === 'CUSTOM' ? customGravity : (gravityMode === 'SPACE' ? 0 : 9.8);

        for(let i=0; i<steps; i++) {
            path.push(pos.clone());
            if (gravityMode === 'EARTH' || gravityMode === 'CUSTOM') {
                vel.y -= g * dt;
            }
            pos.add(vel.clone().multiplyScalar(dt));
            if (gravityMode !== 'SPACE' && pos.y < 0) break; 
        }
        return path;
    }, [data, gravityMode, customGravity]);

    if (points.length < 2) return null;
    return <Line points={points} color={data.color || "white"} opacity={0.3} transparent dashed dashScale={2} />;
}

// --- PHYSICS OBJECT ---
const PhysicsObject = ({ data, isPlaying, gravityMode, customGravity, restitution, friction, showVectors, registry, onUpdateMetric }) => {
  const meshRef = useRef();
  
  const pos = useRef(new THREE.Vector3(0,0,0));
  const vel = useRef(new THREE.Vector3(0,0,0));
  
  // Vector Arrows
  const velArrowRef = useRef();
  const forceArrowRef = useRef();

  const safeArgs = data.args && data.args.length ? data.args : (data.shape === 'car' ? [4,2,6] : [1,1,1]);
  const radius = data.shape === 'sphere' ? safeArgs[0] : Math.max(...safeArgs)/2;
  const mass = data.mass || 1;
  const isFixed = data.fixed || false;

  useEffect(() => {
    let startY = data.pos[1];
    if (gravityMode !== 'SPACE') {
        if (data.shape === 'sphere' && startY < radius) startY = radius;
        if ((data.shape === 'box' || data.shape === 'car') && startY < safeArgs[1]/2) startY = safeArgs[1]/2;
    }

    pos.current.set(data.pos[0], startY, data.pos[2]);
    vel.current.set(...(data.vel || [0, 0, 0]));

    registry.current[data.label] = {
        pos: pos.current,
        vel: vel.current,
        mass: mass,
        shape: data.shape,
        args: safeArgs,
        rotation: new THREE.Euler(...(data.rotation || [0,0,0])),
        fixed: isFixed, 
        id: Math.random()
    };

    if (meshRef.current) meshRef.current.position.copy(pos.current);
    return () => { delete registry.current[data.label]; };
  }, [data, gravityMode]);

  useFrame((state, delta) => {
    if (registry.current[data.label]) {
        registry.current[data.label].rotation.set(...(data.rotation || [0,0,0])); 
    }

    // --- UPDATED METRICS CALCULATION ---
    if (onUpdateMetric) {
        const speed = vel.current.length();
        const KE = 0.5 * mass * speed * speed;
        let PE = 0;

        if (gravityMode === 'SPACE') {
            // Space Potential Energy (Sum of G*m1*m2 / r)
            // We use absolute value for visualization purposes in the bar chart
            Object.values(registry.current).forEach(other => {
                if (other === registry.current[data.label]) return;
                const dist = pos.current.distanceTo(other.pos);
                if (dist > 0.1) {
                    PE += (100 * mass * other.mass) / dist; // G=100
                }
            });
        } else {
            // Earth Potential Energy (mgh)
            PE = mass * 9.8 * Math.max(0, pos.current.y);
        }

        // Send 'speed' instead of 'height' for the graph
        onUpdateMetric(data.label, { KE, PE, total: KE+PE, speed: speed, time: state.clock.elapsedTime });
    }

    // --- VECTOR ARROWS ---
    if (showVectors && velArrowRef.current && forceArrowRef.current) {
        const speed = vel.current.length();
        if (speed > 0.1) {
            velArrowRef.current.setDirection(vel.current.clone().normalize());
            velArrowRef.current.setLength(Math.min(speed * 0.3, 8)); 
            velArrowRef.current.visible = true;
        } else {
            velArrowRef.current.visible = false;
        }

        if (gravityMode === 'SPACE' && !isFixed) {
            let strongestForce = new THREE.Vector3(0,0,0);
            let maxForceMag = 0;
            
            Object.values(registry.current).forEach(other => {
                if (other === registry.current[data.label] || other.mass <= 0) return;
                const rVec = new THREE.Vector3().subVectors(other.pos, pos.current);
                const distSq = rVec.lengthSq();
                const forceMag = (100 * other.mass) / distSq;
                if (forceMag > maxForceMag) {
                    maxForceMag = forceMag;
                    strongestForce = rVec.normalize();
                }
            });

            if (maxForceMag > 0.1) {
                forceArrowRef.current.setDirection(strongestForce);
                forceArrowRef.current.setLength(3);
                forceArrowRef.current.visible = true;
            } else {
                forceArrowRef.current.visible = false;
            }
        } else {
            forceArrowRef.current.visible = false;
        }
    }

    if (!isPlaying) return;
    if (registry.current[data.label]?.fixed) return;
    if (state.clock.elapsedTime < 0.1) return; 

    const subSteps = 8;
    const dt = Math.min(delta, 0.05) / subSteps; 

    for (let s = 0; s < subSteps; s++) {
        // A. GRAVITY
        if (gravityMode === 'SPACE') {
            Object.values(registry.current).forEach(other => {
                if (other === registry.current[data.label]) return;
                
                if (other.mass > 0) {  
                     const rVec = new THREE.Vector3().subVectors(other.pos, pos.current);
                     const distSq = Math.max(rVec.lengthSq(), 2); 
                     const acceleration = (100 * other.mass) / distSq; 
                     vel.current.add(rVec.normalize().multiplyScalar(acceleration * dt));
                }
            });
        } else if (gravityMode === 'CUSTOM') {
            vel.current.y -= customGravity * dt;
        } else {
            vel.current.y -= 9.8 * dt;
        }

        // B. MOVE
        pos.current.add(vel.current.clone().multiplyScalar(dt));

        // C. COLLISION (Disabled in SPACE)
        if (gravityMode !== 'SPACE') { 
            Object.keys(registry.current).forEach(key => {
                if (key === data.label) return;
                const other = registry.current[key];

                if (data.shape === 'sphere' && (other.shape === 'box' || other.shape === 'car' || other.shape === 'wedge')) {
                    // (Sphere-Box Logic Placeholder)
                    const otherPos = other.pos;
                    const otherQuat = new THREE.Quaternion().setFromEuler(other.rotation);
                    const localPos = pos.current.clone().sub(otherPos).applyQuaternion(otherQuat.clone().invert());
                    const halfW = (other.args[0] || 2) / 2;
                    const halfH = (other.args[1] || 2) / 2;
                    const halfD = (other.args[2] || 2) / 2;
                    if (Math.abs(localPos.x) < halfW + radius && Math.abs(localPos.y) < halfH + radius && Math.abs(localPos.z) < halfD + radius) {
                        const closest = localPos.clone().clamp(new THREE.Vector3(-halfW, -halfH, -halfD), new THREE.Vector3(halfW, halfH, halfD));
                        const dist = localPos.clone().sub(closest).length();
                        if (dist < radius) {
                            let normal = localPos.clone().sub(closest).normalize();
                            if (dist === 0) normal = new THREE.Vector3(0, 1, 0); 
                            normal.applyQuaternion(otherQuat);
                            const overlap = radius - dist;
                            pos.current.add(normal.clone().multiplyScalar(overlap));
                            const vDotN = vel.current.dot(normal);
                            if (vDotN < 0) {
                                const j = -(1 + restitution) * vDotN;
                                vel.current.add(normal.multiplyScalar(j));
                            }
                        }
                    }
                }

                if (data.shape === 'sphere' && other.shape === 'sphere') {
                    const diff = new THREE.Vector3().subVectors(pos.current, other.pos);
                    const dist = diff.length();
                    const minDist = radius + (other.args[0] || 1); 
                    if (dist < minDist) {
                        const overlap = minDist - dist;
                        const normal = diff.normalize();
                        if (!other.fixed) {
                            pos.current.add(normal.clone().multiplyScalar(overlap * 0.5));
                        } else {
                            pos.current.add(normal.clone().multiplyScalar(overlap));
                        }
                        const vRel = new THREE.Vector3().subVectors(vel.current, other.vel);
                        const vDotN = vRel.dot(normal);
                        if (vDotN < 0) {
                            const j = -(1 + restitution) * vDotN;
                            const impulse = normal.clone().multiplyScalar(j / (other.fixed ? 1 : 2));
                            vel.current.add(impulse);
                            if(!other.fixed) other.vel.sub(impulse);
                        }
                    }
                }
            });
        }

        // D. FLOOR
        if (gravityMode !== 'SPACE' && pos.current.y < radius) {
            pos.current.y = radius;
            vel.current.y *= -restitution;
            const frictionFactor = 1 - (friction * dt * 10);
            vel.current.x *= Math.max(0, frictionFactor);
            vel.current.z *= Math.max(0, frictionFactor);
        }

    } 

    if (meshRef.current) {
        meshRef.current.position.copy(pos.current);
        if (data.shape === 'sphere') {
            meshRef.current.rotation.x += vel.current.z * delta;
            meshRef.current.rotation.z -= vel.current.x * delta;
        }
    }
  });

  const material = <meshStandardMaterial color={data.color || "white"} />;
  
  const renderShape = () => {
    if (data.shape === 'car') return <CarVisual args={safeArgs} color={data.color} />;
    if (data.shape === 'wedge') return <WedgeVisual args={safeArgs} color={data.color} />;
    if (data.shape === 'sphere') {
        return (
             <Trail width={1} length={12} color={data.color} attenuation={(t) => t * t}>
                <Sphere args={[radius, 32, 32]}>{material}</Sphere>
             </Trail>
        );
    }
    return <Box args={safeArgs}>{material}</Box>;
  };

  return (
    <group ref={meshRef} rotation={data.rotation || [0, 0, 0]}>
      {renderShape()}
      {!isFixed && (
          <Text position={[0, safeArgs[1] + 2.5, 0]} fontSize={0.8} color="white" anchorX="center" anchorY="middle">
            {data.label}
          </Text>
      )}
      {showVectors && (
        <>
            <primitive object={new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(0,0,0), 1, 0x00ff00)} ref={velArrowRef} />
            <primitive object={new THREE.ArrowHelper(new THREE.Vector3(0,-1,0), new THREE.Vector3(0,0,0), 1, 0xff0000)} ref={forceArrowRef} />
        </>
      )}
    </group>
  );
};

const SimulationScene = ({ objects, isPlaying, gravityMode, customGravity, restitution, friction, showVectors, showGhost, onUpdateEnergy }) => {
  const registry = useRef({}); 
  return (
    <div className="h-full w-full bg-gray-950 relative">
      {!isPlaying && <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-yellow-400 font-bold animate-pulse">⏸ PAUSED - CLICK PLAY</div>}
      <Canvas camera={{ position: [0, 40, 0], fov: 45 }} shadows>
        <color attach="background" args={["#030712"]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 20, 10]} intensity={1.5} castShadow />
        <OrbitControls makeDefault />
        {gravityMode !== 'SPACE' && <Grid infiniteGrid sectionColor="#4f46e5" cellColor="#1e1b4b" position={[0, -0.01, 0]} />}
        
        {objects && objects.map((obj, i) => (
          <group key={`${i}-${obj.label}`}>
            <PhysicsObject 
                data={obj} 
                isPlaying={isPlaying}
                gravityMode={gravityMode}
                customGravity={customGravity}
                restitution={restitution}
                friction={friction}
                showVectors={showVectors}
                registry={registry} 
                onUpdateMetric={onUpdateEnergy}
            />
            {showGhost && !isPlaying && (
                <GhostTrajectory data={obj} gravityMode={gravityMode} customGravity={customGravity} />
            )}
          </group>
        ))}
      </Canvas>
    </div>
  );
};

export default SimulationScene;