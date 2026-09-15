import React, { useEffect, useRef } from 'react';

export const CinematicCanvasBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        let animationFrameId;
        let isVisible = true;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize, { passive: true });

        // Freeze animation when tab is not active to save 100% CPU/GPU
        const handleVisibilityChange = () => {
            isVisible = !document.hidden;
            if (isVisible) {
                render();
            } else {
                cancelAnimationFrame(animationFrameId);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Responsive node count: 28 for desktop, 14 for mobile
        const isMobile = width < 768;
        const nodeCount = isMobile ? 14 : 26;

        const nodes = Array.from({ length: nodeCount }, () => ({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
            radius: Math.random() * 1.5 + 0.8,
            color: Math.random() > 0.6 ? '#38bdf8' : Math.random() > 0.3 ? '#a855f7' : '#34d399',
            alpha: Math.random() * 0.5 + 0.3
        }));

        const MAX_DIST_SQ = 110 * 110; // 12100 - Avoids costly Math.sqrt per pair

        let lastTimestamp = 0;
        const targetInterval = 1000 / 30; // 30 FPS fixed cadence

        const render = (timestamp = 0) => {
            if (!isVisible) return;
            animationFrameId = requestAnimationFrame(render);

            const elapsed = timestamp - lastTimestamp;
            if (elapsed < targetInterval) return;
            lastTimestamp = timestamp - (elapsed % targetInterval);

            ctx.clearRect(0, 0, width, height);

            // Update & batch-draw nodes
            for (let i = 0; i < nodes.length; i++) {
                const node = nodes[i];
                node.x += node.vx;
                node.y += node.vy;

                if (node.x < 0) node.x = width;
                else if (node.x > width) node.x = 0;
                if (node.y < 0) node.y = height;
                else if (node.y > height) node.y = 0;

                ctx.beginPath();
                ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                ctx.fillStyle = node.color;
                ctx.globalAlpha = node.alpha;
                ctx.fill();

                // Fast squared-distance line connections (eliminates Math.sqrt)
                for (let j = i + 1; j < nodes.length; j++) {
                    const other = nodes[j];
                    const dx = node.x - other.x;
                    const dy = node.y - other.y;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < MAX_DIST_SQ) {
                        ctx.beginPath();
                        ctx.moveTo(node.x, node.y);
                        ctx.lineTo(other.x, other.y);
                        ctx.strokeStyle = '#6366f1';
                        ctx.globalAlpha = (1 - distSq / MAX_DIST_SQ) * 0.12;
                        ctx.lineWidth = 0.75;
                        ctx.stroke();
                    }
                }
            }

            ctx.globalAlpha = 1.0;
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.75,
                transform: 'translateZ(0)', // Force GPU layer
                willChange: 'transform'
            }}
        />
    );
};

export default React.memo(CinematicCanvasBackground);
