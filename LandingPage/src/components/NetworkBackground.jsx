import React, { useState, useEffect, useMemo } from 'react';

const NODES = [
  { x: 80, y: 120, r: 5, c: 'mint' },
  { x: 190, y: 60, r: 3, c: 'mint' },
  { x: 320, y: 150, r: 7, c: 'coral' },
  { x: 470, y: 70, r: 4, c: 'mint' },
  { x: 590, y: 170, r: 5.5, c: 'gold' },
  { x: 720, y: 55, r: 3.5, c: 'mint' },
  { x: 860, y: 130, r: 6, c: 'mint' },
  { x: 940, y: 40, r: 4, c: 'coral' },
  { x: 130, y: 280, r: 4, c: 'gold' },
  { x: 300, y: 320, r: 3.5, c: 'mint' },
  { x: 480, y: 350, r: 5, c: 'mint' },
  { x: 660, y: 300, r: 4, c: 'coral' },
  { x: 820, y: 340, r: 4.5, c: 'mint' },
  { x: 60, y: 460, r: 3.5, c: 'mint' },
  { x: 230, y: 500, r: 5, c: 'gold' },
  { x: 410, y: 470, r: 4, c: 'mint' },
  { x: 590, y: 520, r: 6, c: 'coral' },
  { x: 770, y: 480, r: 3.5, c: 'mint' },
  { x: 920, y: 540, r: 4.5, c: 'mint' },
  { x: 150, y: 620, r: 4, c: 'mint' },
  { x: 400, y: 650, r: 3.5, c: 'gold' },
  { x: 650, y: 640, r: 4.5, c: 'mint' },
  { x: 850, y: 610, r: 3.5, c: 'coral' }
];

const EDGES = [
  [0, 1], [1, 3], [2, 3], [3, 5], [4, 5], [5, 6], [6, 7], [0, 8], [2, 9], [4, 10], [6, 11],
  [8, 9], [9, 10], [10, 11], [11, 12], [8, 13], [9, 14], [10, 15], [11, 16], [12, 17],
  [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [13, 19], [15, 20], [16, 21], [18, 22],
  [19, 20], [20, 21], [21, 22]
];

const COLOR_MAP = {
  mint: '#54D6C2',
  coral: '#E27453',
  gold: '#D9A653'
};

const GLOW_MAP = {
  mint: 'url(#glowMint)',
  coral: 'url(#glowCoral)',
  gold: 'url(#glowGold)'
};

export default function NetworkBackground() {
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    let frame1, frame2;
    frame1 = requestAnimationFrame(() => {
      frame2 = requestAnimationFrame(() => {
        setIsAnimated(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame1);
      if (frame2) cancelAnimationFrame(frame2);
    };
  }, []);

  const edgesData = useMemo(() => {
    return EDGES.map(([a, b]) => {
      const na = NODES[a];
      const nb = NODES[b];
      const len = Math.hypot(nb.x - na.x, nb.y - na.y);
      return {
        x1: na.x,
        y1: na.y,
        x2: nb.x,
        y2: nb.y,
        len
      };
    });
  }, []);

  const nodeDurations = useMemo(() => {
    return NODES.map((_, i) => 5 + (i % 4) + Math.sin(i) * 0.5);
  }, []);

  return (
    <svg id="network" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="glowMint" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#54D6C2" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#54D6C2" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowCoral" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E27453" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E27453" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="glowGold" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D9A653" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#D9A653" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g id="edges">
        {edgesData.map((edge, i) => (
          <line
            key={`edge-${i}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            className="edge"
            strokeDasharray={edge.len}
            style={{
              strokeDashoffset: isAnimated ? 0 : edge.len,
              strokeOpacity: isAnimated ? 0.45 : 0,
              transition: `stroke-dashoffset 1.1s ease ${0.9 + i * 0.035}s, stroke-opacity 0.6s ease ${0.9 + i * 0.035}s`
            }}
          />
        ))}
      </g>

      <g id="nodes">
        {NODES.map((node, i) => {
          const duration = nodeDurations[i];
          const delay = i * 180;
          return (
            <g
              key={`node-group-${i}`}
              style={{
                transformOrigin: `${node.x}px ${node.y}px`,
                animation: `nodeFloat ${duration}s ease-in-out infinite`,
                animationDelay: `${delay}ms`
              }}
            >
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r * 5}
                fill={GLOW_MAP[node.c]}
                className="node-glow"
                style={{
                  opacity: isAnimated ? 0.7 : 0,
                  transition: `opacity 0.8s ease ${1.3 + i * 0.05}s`
                }}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={node.r}
                fill={COLOR_MAP[node.c]}
                className="node-core"
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transition: `opacity 0.8s ease ${1.3 + i * 0.05}s`
                }}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
