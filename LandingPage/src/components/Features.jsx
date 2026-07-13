import React from 'react';

export default function Features() {
  const features = [
    {
      icon: "GRAPH",
      title: "Neo4j Journey Graph",
      desc: "Represents human paths as interconnected nodes of users, goals, experiences, and skills rather than isolated database records."
    },
    {
      icon: "SEARCH",
      title: "Semantic Context Search",
      desc: "Combines vector embeddings, full-text indexes, and relationship traversal to match people facing similar circumstances, not just keywords."
    },
    {
      icon: "SPEECH",
      title: "Sarvam AI Voice Engine",
      desc: "Supports multilingual voice queries, translation, and localized speech responses, making guidance accessible across language barriers."
    },
    {
      icon: "TRUST",
      title: "Verifiable Trust Layer",
      desc: "Validates experiences through resume documents, certificates, and GitHub repositories uploaded via Cloudinary and secured with verification badges."
    },
    {
      icon: "INSIGHT",
      title: "Evidence-Backed Insights",
      desc: "LLM layer reasons over verified journey histories to extract warnings and milestones, preventing generic advice and hallucinations."
    },
    {
      icon: "GROWTH",
      title: "Compounding Knowledge Base",
      desc: "Every shared journey structures itself into the graph, continuously enriching search recommendations for the entire community."
    }
  ];

  return (
    <section className="section" id="features">
      <div className="section-header">
        <h2 className="section-title">Key <span className="accent">Features</span></h2>
        <p className="section-subtitle">
          Engineered for credibility, conversational simplicity, and deep path visualization.
        </p>
      </div>

      <div className="grid-layout">
        {features.map((feat, idx) => (
          <div key={idx} className="glass-card">
            <div className="card-icon" style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 'bold', width: 'auto', padding: '0 10px' }}>
              {feat.icon}
            </div>
            <h4 className="card-title">{feat.title}</h4>
            <p className="card-desc">{feat.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
