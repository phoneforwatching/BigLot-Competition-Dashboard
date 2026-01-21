<script lang="ts">
    import { T, useTask } from "@threlte/core";
    import { Float, ContactShadows } from "@threlte/extras";
    import { Color } from "three";

    let rotation = 0;
    useTask((delta) => {
        rotation += delta * 0.3;
    });

    const goldColor = "#FFD700";
</script>

<!-- Ambient light for base illumination -->
<T.AmbientLight intensity={0.4} />

<!-- Main High-Contrast Light -->
<T.DirectionalLight position={[10, 15, 10]} intensity={3} castShadow />

<!-- Dynamic Rim Lights for 3D POP -->
<T.PointLight position={[-8, 5, -5]} intensity={2} color="#00ffff" />
<T.PointLight position={[8, -5, 5]} intensity={2} color="#ff00ff" />
<T.PointLight position={[0, 10, 0]} intensity={1.5} color={goldColor} />

<Float speed={1.5} rotationIntensity={2} floatIntensity={2}>
    <!-- Core Trading Crystal -->
    <T.Group rotation.y={rotation} rotation.z={rotation * 0.2}>
        <!-- Central Jewel -->
        <T.Mesh castShadow receiveShadow>
            <T.IcosahedronGeometry args={[2, 0]} />
            <T.MeshStandardMaterial
                color={goldColor}
                metalness={1}
                roughness={0.1}
                emissive={goldColor}
                emissiveIntensity={0.1}
            />
        </T.Mesh>

        <!-- Orbital Rings -->
        <T.Mesh rotation.x={Math.PI / 2} rotation.y={rotation * 0.5}>
            <T.TorusGeometry args={[3.2, 0.04, 16, 100]} />
            <T.MeshStandardMaterial
                color={goldColor}
                metalness={1}
                roughness={0}
            />
        </T.Mesh>

        <T.Mesh rotation.x={Math.PI / 3} rotation.y={-rotation * 0.8}>
            <T.TorusGeometry args={[3.6, 0.03, 16, 100]} />
            <T.MeshStandardMaterial
                color={goldColor}
                metalness={1}
                roughness={0}
            />
        </T.Mesh>

        <T.Mesh rotation.x={-Math.PI / 4} rotation.y={rotation * 1.2}>
            <T.TorusGeometry args={[4, 0.02, 16, 100]} />
            <T.MeshStandardMaterial
                color={goldColor}
                metalness={1}
                roughness={0}
            />
        </T.Mesh>
    </T.Group>
</Float>

<!-- Dynamic Starfield/Data Particles -->
{#each Array(80) as _, i}
    <Float
        speed={0.2 + Math.random()}
        floatIntensity={2}
        position={[
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 20,
        ]}
    >
        <T.Mesh>
            <T.SphereGeometry args={[0.03 + Math.random() * 0.04, 8, 8]} />
            <T.MeshStandardMaterial
                color={Math.random() > 0.5 ? goldColor : "#ffffff"}
                emissive={goldColor}
                emissiveIntensity={4}
            />
        </T.Mesh>
    </Float>
{/each}

<ContactShadows
    blur={3}
    far={15}
    opacity={0.4}
    scale={25}
    position={[0, -8, 0]}
/>
