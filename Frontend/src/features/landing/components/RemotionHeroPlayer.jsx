import React, { useRef, useEffect, useState } from 'react';
import { Player } from '@remotion/player';
import { RemotionHeroComposition } from './RemotionHeroComposition';

export const RemotionHeroPlayer = () => {
    const playerRef = useRef(null);
    const containerRef = useRef(null);
    const [inView, setInView] = useState(true);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                const visible = entry.isIntersecting;
                setInView(visible);
                if (playerRef.current) {
                    try {
                        if (visible) {
                            playerRef.current.play();
                        } else {
                            playerRef.current.pause();
                        }
                    } catch {
                        // ignore
                    }
                }
            },
            { threshold: 0.08 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="remotion-hero-player-wrapper" ref={containerRef}>
            <div className="player-glow-backdrop" />
            <div className="player-hardware-frame">
                <Player
                    ref={playerRef}
                    component={RemotionHeroComposition}
                    durationInFrames={300}
                    compositionWidth={840}
                    compositionHeight={440}
                    fps={30}
                    style={{
                        width: '100%',
                        aspectRatio: '840 / 440',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        display: 'block',
                        transform: 'translateZ(0)',
                        willChange: 'transform'
                    }}
                    autoPlay
                    loop
                    showControls={false}
                />
            </div>
            <div className="player-caption">
                <span className="live-dot" />
                <span>Programmatic Remotion Live Render • 4-Engine Cockpit Telemetry</span>
            </div>
        </div>
    );
};

export default React.memo(RemotionHeroPlayer);
