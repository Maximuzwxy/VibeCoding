# Phase 1 — CelestialSystem Base Class + Solar System 3D Orbits

## Goal
Build a reusable `CelestialSystem` base class and render the full solar system with 3D orbits, driven by configuration.

## Requirements

### CelestialSystem Base Class
- **Center body**: self-rotating, configurable texture/size/color
- **Orbiting bodies**: revolve around the center + self-rotate, configurable orbit radius, speed, size
- **Axial tilt**: controlled via `axialTilt` parameter (e.g., Earth 23.5°, Uranus 97.8°)
- **Orbit lines**: drawn with elliptical curves, configurable color
- **Starfield background**: randomly scattered particles
- **Animation control**: `speedMultiplier`, `animate()` loop
- **Hook extension**: `onInit` and `onAnimate` hooks for custom logic without subclassing
- **Lifecycle**: `init(containerId)` and `dispose()` methods

### Solar System Scene
- Center: Sun (self-rotating, textured)
- 8 orbiting planets: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- Each planet configurable: orbit radius, size, speed, color, axial tilt
