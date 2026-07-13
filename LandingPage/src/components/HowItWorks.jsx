import React from 'react';

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Natural Interaction",
      desc: "Type or speak. Voice queries are transcribed via Sarvam AI speech models to capture your background, goals, and core dilemmas naturally."
    },
    {
      num: "02",
      title: "Context Parsing",
      desc: "LLMs (Groq LLaMA & Gemini) process the conversation to structure your queries, extracting background details, skills, and target transitions."
    },
    {
      num: "03",
      title: "Neo4j Traversal",
      desc: "PathFinder searches its Neo4j AuraDB graph, combining semantic vector search and traversal to retrieve matching chronological paths."
    },
    {
      num: "04",
      title: "Pattern Synthesis",
      desc: "Gemini analyzes matching journeys, extracts recurring bottlenecks, and presents evidence-backed recommendations directly in the client."
    }
  ];

  return (
    <section className="section" id="how-it-works">
      <div className="section-header">
        <h2 className="section-title">How It <span className="accent">Works</span></h2>
        <p className="section-subtitle">
          Under the hood: How PathFinder turns open-ended career conversations into structured, searchable graph database retrievals.
        </p>
      </div>

      <div className="steps-flow">
        {steps.map((step, idx) => (
          <div key={idx} className="step-card">
            <div className="step-num">{step.num}</div>
            <h4 className="step-title">{step.title}</h4>
            <p className="step-desc">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
