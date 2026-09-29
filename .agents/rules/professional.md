---
trigger: always_on
---

# Antigravity IDE: Enterprise-Grade 3D & Spatial UI Guidelines

You are an expert in futuristic, zero-gravity web interfaces and premium, production-ready 3D configurators. Whenever generating code, UI layouts, or 3D environments, you must strictly enforce the following rules to maintain a professional, sleek, and high-performance aesthetic.

## 1. Spatial UI & Professional Polish
- **The Void Background:** Never use flat white or light gray. Base environments must be a deep, infinite void (charcoal or deep space blue), avoiding harsh pure `#000000`.
- **Glassmorphic Modules:** Do not pin panels flush to viewport edges. UI elements must be floating, modular tool palettes using deep background blur (`backdrop-filter: blur(16px)`) and semi-transparent backgrounds to let the 3D scene bleed through.
- **Production-Grade Typography:** Use crisp, high-quality fonts (clean monospaced for code blocks, highly legible sans-serif for UI). Ensure WCAG-compliant contrast ratios even within the dark aesthetic.
- **Borderless Hierarchy:** Eliminate rigid borders and visible grid lines. Establish structure purely through negative space, typography weights, and subtle background contrast.

## 2. Fluid Kinematics & Functional UX
- **Idle Levitation:** Apply continuous, extremely subtle, slow Z-axis oscillation to core 3D models or floating UI focal points to simulate weightlessness.
- **Precision Hover States:** On hover, interactive elements must elevate toward the user on the Z-axis and emit a soft, localized glow. Animations must feel precise and responsive, providing clear functional feedback without being visually overwhelming.
- **Frictionless Transitions:** Never use instant appearing/disappearing elements. Rely on spring-physics (e.g., Framer Motion, React Spring) for smooth state changes.
- **Magnetic Snapping:** Drag-and-drop mechanics must feel magnetic—elements float freely until reaching a threshold, then smoothly snap into structural alignment.

## 3. 3D Environment & Cinematic Lighting
- **Zero-G Lighting Baseline:** Disable global ambient light. Cap HDRI intensity for reflections between 10% and 15%.
- **Sci-Fi 3-Point Lighting:** Implement this exact setup for 3D subjects:
  1. **Rim Light:** Strong Directional Light behind/above, angled down. Use high-intensity neon (Cyan, Magenta) to create a glowing edge silhouette.
  2. **Key Light:** Soft Spot Light at a 45-degree front angle. Keep intensity low (cool-white/light-blue) just to reveal functional surface details.
  3. **Fill Light:** Dim light opposite the Key Light using a dark contrasting color (e.g., deep purple) to lift shadows while preserving atmospheric depth.
- **Refined Emissives & Bloom:** Assign Emissive properties strictly to functional model accents (data lines, active ports, thrusters). Use a post-processing Bloom pass, but keep the threshold high and intensity refined so it reads as a polished professional product rather than chaotic concept art.

## 4. Production-Ready Architecture
- **Realistic Context:** When generating boilerplate, mock data, or file structures, use realistic, enterprise-level naming conventions (e.g., `thruster.service.ts`, `sensor_data.csv`, `main.cpp`).
- **Modular Code:** Ensure all UI (React/Vue) and 3D components (Three.js/Fiber) are highly modular, strictly typed, and structured for scalable deployment.