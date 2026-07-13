import React from 'react';

export default function ProblemSection() {
  const problems = [
    {
      title: "Reddit: Opinions Without Credibility",
      desc: "Reddit is full of conflicting advice and anonymous opinions, leaving you to guess if the person behind the text has ever faced your situation."
    },
    {
      title: "LinkedIn: Success Without Reality",
      desc: "LinkedIn shows achievements and promotions, but hides the failures, pivots, uncertainties, and career regrets that happened behind the scenes."
    },
    {
      title: "AI Chatbots: Answers Without Context",
      desc: "Generative AI summarizes pros and cons, but lacks actual context. It doesn't know how a specific user's journey unfolded over time."
    }
  ];

  const solutions = [
    {
      title: "Verifiable Proof Verification",
      desc: "Users upload GitHub repositories, resumes, and certificates. AI validates these proofs, generating verification badges to anchor trust."
    },
    {
      title: "Complete Journey Mapping",
      desc: "PathFinder indexes the entire journey—including setbacks, salary pivots, and side steps—providing a realistic roadmap."
    },
    {
      title: "Neo4j Knowledge Graph Traversal",
      desc: "Retrieval traverses chronologically connected experience nodes, answering the core question: 'Who has walked this path before me?'"
    }
  ];

  return (
    <section className="section" id="problem">
      <div className="section-header">
        <h2 className="section-title">The <span className="accent">Problem</span> vs The <span className="accent">Solution</span></h2>
        <p className="section-subtitle">
          Why traditional forums, social networks, and generic AI tools leave us stuck when making life-changing career decisions.
        </p>
      </div>

      <div className="compare-layout">
        {/* Traditional Platforms */}
        <div className="compare-card problem-side">
          <div className="compare-tag">Traditional Advice</div>
          <ul className="compare-list">
            {problems.map((p, idx) => (
              <li key={idx} className="compare-item">
                <span className="compare-bullet" style={{ color: 'var(--coral)', marginRight: '4px' }}>●</span>
                <div className="compare-text">
                  <h4>{p.title}</h4>
                  <p>{p.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* PathFinder */}
        <div className="compare-card solution-side">
          <div className="compare-tag">PathFinder</div>
          <ul className="compare-list">
            {solutions.map((s, idx) => (
              <li key={idx} className="compare-item">
                <span className="compare-bullet" style={{ color: 'var(--mint)', marginRight: '4px' }}>●</span>
                <div className="compare-text">
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
