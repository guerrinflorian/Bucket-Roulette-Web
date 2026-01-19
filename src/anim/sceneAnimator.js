import { gsap } from 'gsap';

export class SceneAnimator {
    constructor(refs) {
        this.refs = refs;
        this.timeline = null;
    }

    // Helper to get camera stage
    get camera() {
        return this.refs.cameraStage;
    }

    // --- Utility: Camera Shake ---
    shakeCamera(intensity = 10, duration = 0.5) {
        if (!this.camera) return;
        gsap.fromTo(this.camera,
            { x: 0, y: 0 },
            {
                x: `random(-${intensity}, ${intensity})`,
                y: `random(-${intensity}, ${intensity})`,
                duration: 0.05,
                repeat: Math.floor(duration / 0.05),
                yoyo: true,
                clearProps: "x,y"
            }
        );
    }

    // --- Sequence: Barrel Inspect / Reload ---
    async playBarrelInspectSequence(revealCount) {
        if (!this.refs.barrel || !this.camera) return;

        // 1. Vignette & Zoom
        const tl = gsap.timeline();
        tl.to(this.refs.vignette, { opacity: 1, duration: 0.25 });
        tl.to(this.camera, {
            scale: 1.6,
            x: -1920 * 0.15, // Slight pan to center barrel
            y: -1080 * 0.15,
            duration: 1.2,
            ease: "power2.inOut"
        }, "<");

        // 2. Spin Barrel
        tl.to(this.refs.barrel, {
            rotation: 360 * 2,
            duration: 1.5,
            ease: "power1.inOut"
        }, "-=0.8");

        // 3. Reveal/Pop slots (Simulated)
        // We assume bullets are children/refs of barrel group
        // This is a placeholder for visual "pop" of slots
        if (this.refs.bulletSlots) {
            tl.to(this.refs.bulletSlots, {
                scale: 1.2,
                duration: 0.1,
                yoyo: true,
                repeat: 5,
                stagger: 0.1
            }, "-=1.0");
        }

        // 4. Freeze & Text
        // (Assuming there's a toast ref, handled by state mostly, but we pause here)
        tl.to({}, { duration: 0.5 }); // Wait

        // 5. Slight Zoom Out but keep tension
        tl.to(this.camera, {
            scale: 1.25,
            x: 0,
            y: 0,
            duration: 0.5,
            ease: "power2.out"
        });

        tl.to(this.refs.vignette, { opacity: 0.3, duration: 0.5 }, "<");

        await tl;
    }

    // --- Sequence: Shoot ---
    async playShootSequence(target, isReal) {
        if (!this.refs.gun || !this.camera) return;

        const tl = gsap.timeline();
        const isEnemy = target === 'enemy';
        const isSelf = target === 'self';

        // 1. Aim
        const aimRotation = isEnemy ? -15 : 25; // Simple rotation for 2D sprite
        // For 2D sprite flipping/aiming, we might need ScaleX or Rotation depending on sprite orientation
        // Assuming gun aims left-ish by default or we rotate

        tl.to(this.refs.gun, {
            rotation: aimRotation,
            duration: 0.3,
            ease: "back.out(1.2)"
        });

        // 2. Fire !
        // Flash
        if (this.refs.muzzleFlash) {
            tl.set(this.refs.muzzleFlash, { opacity: 1, scale: 0.5 }, "+=0.1");
            tl.to(this.refs.muzzleFlash, { opacity: 0, scale: 1.5, duration: 0.15 });
        }

        // Spin the barrel (mechanic action)
        tl.to(this.refs.barrel, {
            rotation: "+=60", // Rotate 1/6th turn
            duration: 0.2,
            ease: "power1.out"
        }, "<");

        // Recoil
        tl.to(this.refs.gun, {
            x: "-=20",
            rotation: aimRotation + (isEnemy ? 10 : -10),
            duration: 0.05,
            ease: "power4.out"
        }, "<");

        // Shake
        tl.add(() => this.shakeCamera(isReal ? 15 : 5, 0.2), "<");

        // 3. Result Impact
        if (isReal) {
            // Impact Effect
            // tl.to(targetHealthBar, ...) handled by reactivity usually, but we can animate punch
        } else {
            // Blank click
        }

        // 4. Reset (Keep slight zoom for immersion)
        tl.to(this.refs.gun, {
            x: 0,
            rotation: 0,
            duration: 0.5,
            ease: "power2.out"
        }, "+=0.2");

        tl.to(this.camera, {
            scale: 1.15, // Keep zoomed in slightly
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "power2.out"
        }, "<");

        tl.to(this.refs.vignette, { opacity: 0, duration: 0.3 }, "<");

        await tl;
    }

    // --- Sequence: Reload items ---
    async playReloadSequence() {
        // Simple bounce in for now
        // Logic handled by reactivity mostly
    }
}

export function createSceneAnimator(refs) {
    return new SceneAnimator(refs);
}
