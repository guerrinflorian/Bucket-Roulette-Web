# Visual & Animation System

This project uses a "Cinematic Stage" approach for rendering the game.

## Architecture

- **GameScene.vue**: The pure visual component.
    - Contains a fixed size `#stageRoot` (1920x1080).
    - Scales automatically to fit the window (`scale = min(RatioW, RatioH)`).
    - Uses CSS Layers ("z-index" via DOM order) for depth: Background -> Enemy -> Table -> Props -> Player.
- **sceneAnimator.js**: Handles GSAP animations.
    - Manipulates `#cameraStage` for zooms/pans.
    - Manipulates individual refs (Gun, Barrel) for game actions.
- **GameScreen.vue**: The controller.
    - Connects `GameStore` state to `GameScene` props.
    - Triggers `animator` sequences before updating game state.

## How to add Assets

1. Place PNG/JPG in `src/assets/`.
2. Import in `GameScene.vue`:
   ```js
   import myAsset from '../assets/my_asset.png';
   ```
3. Add to the defined Layer in `<template>`:
   ```html
   <div class="layer props-layer">
       <img :src="myAsset" class="my-asset-img" />
   </div>
   ```
4. Style it in `<style scoped>` using absolute positioning relative to 1920x1080.

## Changing Positions

All positions are **absolute pixels** based on a **1920x1080** canvas.
- To move the Gun: update `.gun-group` in `GameScene.vue` CSS (e.g. `top: 650px; left: 35%;`).
- Do NOT use `vh` or `vw` for internal elements, use `px`. The Scale system handles the responsiveness.

## Animations

- Use `sceneAnimator.js`.
- Add a new method `async playMySequence()`.
- Use `this.refs.cameraStage` to zoom.
- Use `gsap` timelines.
- Call it from `GameScreen.vue`.
