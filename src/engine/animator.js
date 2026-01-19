import { gsap } from 'gsap';

export class Animator {
    constructor(stageRef) {
        this.stage = stageRef;
        this.isAnimating = false;
    }

    /**
     * Centers the camera on a specific element
     * @param {HTMLElement} element - The target element to zoom into
     * @param {number} scale - Zoom level
     * @param {number} duration - Animation duration
     */
    zoomTo(element, scale = 1.4, duration = 0.8) {
        if (!element || !this.stage) return Promise.resolve();

        const rect = element.getBoundingClientRect();
        const stageRect = this.stage.getBoundingClientRect();

        // Calculate center of element relative to stage center
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;

        const stageCenterX = stageRect.left + stageRect.width / 2;
        const stageCenterY = stageRect.top + stageRect.height / 2;

        const translateX = stageCenterX - elementCenterX;
        const translateY = stageCenterY - elementCenterY;

        return gsap.to(this.stage, {
            scale: scale,
            x: translateX * scale,
            y: translateY * scale,
            duration: duration,
            ease: 'power3.out'
        });
    }

    resetZoom(duration = 0.6) {
        return gsap.to(this.stage, {
            scale: 1,
            x: 0,
            y: 0,
            duration: duration,
            ease: 'power2.inOut'
        });
    }

    /**
     * Screen shake effect
     */
    shake(intensity = 10, duration = 0.4) {
        const tl = gsap.timeline();
        tl.to(this.stage, { x: `+=${intensity}`, y: `-=${intensity}`, duration: 0.05 });
        tl.to(this.stage, { x: `-=${intensity * 2}`, y: `+=${intensity * 2}`, duration: 0.05 });
        tl.to(this.stage, { x: `+=${intensity * 1.5}`, y: `-=${intensity * 1.5}`, duration: 0.05 });
        tl.to(this.stage, { x: 0, y: 0, duration: 0.05 });
        return tl;
    }

    /**
     * Cinematic shoot sequence
     */
    async shootSequence({ target, result, pistolRef, barrelRef, hitCallback }) {
        this.isAnimating = true;

        // 1. Zoom to table/pistol
        await this.zoomTo(pistolRef, 1.4, 0.5);

        const tl = gsap.timeline();

        // 2. Anticipation (pistol pullback)
        tl.to(pistolRef, { rotate: target === 'enemy' ? 5 : -5, x: -10, duration: 0.2, ease: 'back.in(2)' });

        // 3. The Shot
        tl.add(() => {
            this.shake(15, 0.3);
            if (hitCallback) hitCallback();
        });

        tl.to(pistolRef, {
            rotate: target === 'enemy' ? -25 : 25,
            x: 20,
            duration: 0.1,
            ease: 'power4.out',
            onComplete: () => {
                // Impact freeze
                gsap.to({}, { duration: 0.08 });
            }
        });

        // 4. Recovery
        tl.to(pistolRef, { rotate: 0, x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });

        await tl;

        // 5. If result is important, zoom to face or barrel
        if (result.damage > 0) {
            // Zoom to target face? (assuming we have a ref or just zoom more)
            await gsap.to({}, { duration: 0.5 });
        }

        await this.resetZoom();
        this.isAnimating = false;
    }

    /**
     * Reloading sequence
     */
    async reloadSequence(barrelRef) {
        this.isAnimating = true;
        await this.zoomTo(barrelRef, 1.7, 0.6);

        // Pulse effect on barrel
        await gsap.to(barrelRef, { scale: 1.1, duration: 0.2, yoyo: true, repeat: 1 });

        // Wait for slots to fill (could be triggered externally or here)
        await gsap.to({}, { duration: 1.0 });

        await this.resetZoom();
        this.isAnimating = false;
    }
}

export const createAnimator = (stageRef) => new Animator(stageRef);
