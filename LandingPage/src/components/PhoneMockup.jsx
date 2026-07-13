import React from 'react';

export default function PhoneMockup({
  time = "9:41",
  statusLabel = "PathFinder",
  journeyLabel = "Developer Profile",
  journeyName = "@star-builder-45",
  milestoneLabel = "Milestone",
  milestoneText = "Owns proprietary tech infrastructure and drives system scale at Zerodha."
}) {
  return (
    <div className="phone-wrap">
      <div className="phone-glow" />
      <div className="phone">
        <div className="phone-notch" />
        <div className="phone-screen">
          <div className="screen-status">
            <span>{time}</span>
            <span>●&nbsp;{statusLabel}</span>
          </div>
          <div className="screen-label">
            <p className="eb">{journeyLabel}</p>
            <p className="tt">{journeyName}</p>
          </div>
          
          <svg viewBox="0 0 200 170" style={{ width: '100%', height: '166px', marginTop: '4px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3" markerHeight="3" orient="auto-start-reverse">
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#1F6F6B" />
              </marker>
            </defs>

            {/* Connection Edges */}
            {/* Center to Goal 1 (Deploying Ecosystem Capital) */}
            <path d="M 122 82 L 134 69" stroke="#1F6F6B" strokeWidth="0.6" fill="none" markerEnd="url(#arrow)" />
            <text x="127" y="74" fontSize="1.8" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">HAS_GOAL</text>

            {/* Center to Goal 2 (Owning Proprietary Tech) */}
            <path d="M 78 82 L 72 82" stroke="#1F6F6B" strokeWidth="0.6" fill="none" markerEnd="url(#arrow)" />
            <text x="75" y="80" fontSize="1.8" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">HAS_GOAL</text>

            {/* Center to Goal 3 (Capitalizing Macro Syndicates) */}
            <path d="M 100 88 L 100 112" stroke="#1F6F6B" strokeWidth="0.6" fill="none" markerEnd="url(#arrow)" />
            <text x="96" y="99" fontSize="1.8" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">HAS_GOAL</text>

            {/* Center to Exp 1 (Scaling Commercial Real Estate) */}
            <path d="M 122 84 L 128 90" stroke="#1F6F6B" strokeWidth="0.6" fill="none" markerEnd="url(#arrow)" />
            <text x="123" y="89" fontSize="1.8" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">HAS_EXPERIENCE</text>

            {/* Center to Exp 2 (Legal Incorporation) */}
            <path d="M 85 88 L 74 102" stroke="#1F6F6B" strokeWidth="0.6" fill="none" markerEnd="url(#arrow)" />
            <text x="82" y="98" fontSize="1.8" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">HAS_EXPERIENCE</text>

            {/* Center to Exp 3 (Launch Coin Mutual Fund) */}
            <path d="M 88 76 L 78 59" stroke="#1F6F6B" strokeWidth="0.6" fill="none" markerEnd="url(#arrow)" />
            <text x="86" y="69" fontSize="1.8" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">HAS_EXPERIENCE</text>

            {/* Experiences to Skills */}
            {/* Exp 2 (Legal Incorporation) to Skill 1 (Direct Asset Management) */}
            <path d="M 40 105 L 36 98" stroke="#1F6F6B" strokeWidth="0.5" strokeDasharray="1,1" fill="none" markerEnd="url(#arrow)" />
            <text x="35" y="103" fontSize="1.6" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">BUILT_SKILL</text>

            {/* Exp 2 to Skill 2 (Agile Products Req) */}
            <path d="M 40 114 L 38 132" stroke="#1F6F6B" strokeWidth="0.5" strokeDasharray="1,1" fill="none" markerEnd="url(#arrow)" />
            <text x="35" y="125" fontSize="1.6" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">BUILT_SKILL</text>

            {/* Exp 1 to Skill 3 (Peer-Peer Sales Execution) */}
            <path d="M 158 99 L 164 106" stroke="#1F6F6B" strokeWidth="0.5" strokeDasharray="1,1" fill="none" markerEnd="url(#arrow)" />
            <text x="163" y="101" fontSize="1.6" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">BUILT_SKILL</text>

            {/* Exp 4 to Skill 4 (Fintech Pricing Strategy) */}
            <path d="M 154 38 L 162 48" stroke="#1F6F6B" strokeWidth="0.5" strokeDasharray="1,1" fill="none" markerEnd="url(#arrow)" />
            <text x="160" y="42" fontSize="1.6" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">BUILT_SKILL</text>

            {/* Exp 3 to Skill 5 (Organic Growth) */}
            <path d="M 44 46 L 36 38" stroke="#1F6F6B" strokeWidth="0.5" strokeDasharray="1,1" fill="none" markerEnd="url(#arrow)" />
            <text x="37" y="44" fontSize="1.6" fill="#54626F" textAnchor="middle" fontFamily="IBM Plex Mono">BUILT_SKILL</text>


            {/* Nodes */}
            {/* Center Node: User */}
            <g>
              <rect x="78" y="76" width="44" height="12" rx="6" fill="#05080D" stroke="#54D6C2" strokeWidth="0.8" />
              <text x="100" y="83.5" textAnchor="middle" fill="#54D6C2" fontSize="3.8" fontWeight="600" fontFamily="IBM Plex Mono">@star-builder-45</text>
            </g>

            {/* Goal Nodes (Coral) */}
            {/* Goal 1: Deploying Ecosystem Capital */}
            <g>
              <rect x="120" y="54" width="38" height="15" rx="2" fill="#E27453" />
              <text x="139" y="60.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="139" dy="0">Deploying</tspan>
                <tspan x="139" dy="3.2">Ecosystem Capital</tspan>
              </text>
            </g>
            {/* Goal 2: Owning Proprietary Tech */}
            <g>
              <rect x="42" y="74" width="30" height="15" rx="2" fill="#E27453" />
              <text x="57" y="80.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="57" dy="0">Owning Proprietary</tspan>
                <tspan x="57" dy="3.2">Tech Infra</tspan>
              </text>
            </g>
            {/* Goal 3: Capitalizing Macro Syndicates */}
            <g>
              <rect x="82" y="112" width="36" height="15" rx="2" fill="#E27453" />
              <text x="100" y="118.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="100" dy="0">Capitalizing Macro</tspan>
                <tspan x="100" dy="3.2">Syndicates</tspan>
              </text>
            </g>

            {/* Experience Nodes (Teal) */}
            {/* Exp 1: Scaling Commercial Real Estate */}
            <g>
              <rect x="122" y="90" width="36" height="15" rx="2" fill="#1F6F6B" />
              <text x="140" y="96.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="140" dy="0">Scaling Commercial</tspan>
                <tspan x="140" dy="3.2">Real Estate</tspan>
              </text>
            </g>
            {/* Exp 2: Legal Incorporation Zerodha */}
            <g>
              <rect x="40" y="102" width="34" height="15" rx="2" fill="#1F6F6B" />
              <text x="57" y="108.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="57" dy="0">Legal Incorporation</tspan>
                <tspan x="57" dy="3.2">of Zerodha</tspan>
              </text>
            </g>
            {/* Exp 3: Launch Coin Mutual Fund */}
            <g>
              <rect x="44" y="44" width="34" height="15" rx="2" fill="#1F6F6B" />
              <text x="61" y="50.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="61" dy="0">Launch Coin</tspan>
                <tspan x="61" dy="3.2">Mutual Fund</tspan>
              </text>
            </g>
            {/* Exp 4: Financial Architecture */}
            <g>
              <rect x="118" y="28" width="36" height="15" rx="2" fill="#1F6F6B" />
              <text x="136" y="34.5" textAnchor="middle" fill="#F4F7F9" fontSize="2.5" fontWeight="600" fontFamily="Inter, sans-serif">
                <tspan x="136" dy="0">Financial</tspan>
                <tspan x="136" dy="3.2">Architecture</tspan>
              </text>
            </g>

            {/* Skill Nodes (Faded White Border / Translucent) */}
            {/* Skill 1: Direct Asset Management */}
            <g>
              <rect x="4" y="86" width="32" height="12" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <text x="20" y="91.2" textAnchor="middle" fill="#93A4B3" fontSize="2.2" fontFamily="Inter, sans-serif">
                <tspan x="20" dy="0">Direct Asset</tspan>
                <tspan x="20" dy="2.8">Management</tspan>
              </text>
            </g>
            {/* Skill 2: Agile Products Req */}
            <g>
              <rect x="8" y="132" width="30" height="12" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <text x="23" y="137.2" textAnchor="middle" fill="#93A4B3" fontSize="2.2" fontFamily="Inter, sans-serif">
                <tspan x="23" dy="0">Agile Products</tspan>
                <tspan x="23" dy="2.8">Requirements</tspan>
              </text>
            </g>
            {/* Skill 3: Peer-Peer Sales Execution */}
            <g>
              <rect x="164" y="106" width="32" height="12" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <text x="180" y="111.2" textAnchor="middle" fill="#93A4B3" fontSize="2.2" fontFamily="Inter, sans-serif">
                <tspan x="180" dy="0">Peer-Peer Sales</tspan>
                <tspan x="180" dy="2.8">Execution</tspan>
              </text>
            </g>
            {/* Skill 4: Fintech Pricing Strategy */}
            <g>
              <rect x="162" y="48" width="32" height="12" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <text x="178" y="53.2" textAnchor="middle" fill="#93A4B3" fontSize="2.2" fontFamily="Inter, sans-serif">
                <tspan x="178" dy="0">Fintech Pricing</tspan>
                <tspan x="178" dy="2.8">Strategy</tspan>
              </text>
            </g>
            {/* Skill 5: Organic Growth Marketing */}
            <g>
              <rect x="6" y="28" width="30" height="12" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
              <text x="21" y="33.2" textAnchor="middle" fill="#93A4B3" fontSize="2.2" fontFamily="Inter, sans-serif">
                <tspan x="21" dy="0">Organic Growth</tspan>
                <tspan x="21" dy="2.8">Marketing</tspan>
              </text>
            </g>
          </svg>

          <div className="screen-card">
            <p className="eb">{milestoneLabel}</p>
            <p className="bd">{milestoneText}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
