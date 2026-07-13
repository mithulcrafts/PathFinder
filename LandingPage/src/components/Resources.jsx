import React from 'react';

export default function Resources() {
  const projectResources = [
    {
      icon: "VIDEO",
      title: "Demo Video",
      desc: "Watch a 3-minute video showing the Expo client interface, search loops, and path vector rendering.",
      action: "Watch Video ↗",
      url: "https://www.youtube.com/watch?v=cFn0jj-MVC8"
    },
    {
      icon: "CODE",
      title: "GitHub Repository",
      desc: "Inspect the mobile app codes, Express API routes, Neo4j connection queries, and deployment settings.",
      action: "Browse Code ↗",
      url: "https://github.com/mithulcrafts/PathFinder"
    },
    {
      icon: "SLIDES",
      title: "Presentation Slides",
      desc: "View the official slide deck presenting our problem statements, architecture stack, and monetization plans.",
      action: "Open Slides ↗",
      url: "https://drive.google.com/file/d/1AobVEavMoAPnOungrUzjAT7i7eKRK1ei/view"
    }
  ];

  const docResources = [
    {
      icon: "BLOG",
      title: "Technical Blog",
      desc: "Read the comprehensive blog write-up analyzing user dilemmas, trust validations, and engineering decisions.",
      action: "Read Blog ↗",
      url: "https://dev.to/mithulcrafts/what-if-we-could-search-human-experiences-instead-of-opinions-33nb"
    },
    {
      icon: "SPECS",
      title: "Technical Implementation",
      desc: "Browse detailed schemas, Neo4j cypher graph models, LLaMA prompt designs, and environment settings.",
      action: "View Docs ↗",
      url: "https://github.com/mithulcrafts/PathFinder/tree/main/docs"
    }
  ];

  return (
    <section className="section" id="project-resources" style={{ scrollMarginTop: '60px' }}>
      <div className="section-header">
        <h2 className="section-title">Project <span className="accent">Resources</span></h2>
        <p className="section-subtitle">
          Access codebases, hackathon presentation materials, video demos, and detailed engineering write-ups.
        </p>
      </div>

      <div className="grid-layout" style={{ marginBottom: '56px' }}>
        {projectResources.map((res, idx) => (
          <a
            key={idx}
            href={res.url || "#"}
            className="glass-card"
            target={res.url ? "_blank" : undefined}
            rel={res.url ? "noopener noreferrer" : undefined}
            onClick={res.url ? undefined : (e) => e.preventDefault()}
          >
            <div className="card-icon" style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 'bold', width: 'auto', padding: '0 10px' }}>
              {res.icon}
            </div>
            <h4 className="card-title">{res.title}</h4>
            <p className="card-desc">{res.desc}</p>
            <div className="card-action">{res.action}</div>
          </a>
        ))}
      </div>

      <div className="section-header" style={{ marginBottom: '36px' }}>
        <h3 className="section-title" style={{ fontSize: '24px' }}>Technical <span className="accent">Documentation</span></h3>
      </div>

      <div className="grid-layout" style={{ maxWidth: '780px' }}>
        {docResources.map((res, idx) => (
          <a
            key={idx}
            href={res.url || "#"}
            className="glass-card"
            target={res.url ? "_blank" : undefined}
            rel={res.url ? "noopener noreferrer" : undefined}
            onClick={res.url ? undefined : (e) => e.preventDefault()}
          >
            <div className="card-icon" style={{ fontSize: '10px', fontFamily: 'var(--mono)', fontWeight: 'bold', width: 'auto', padding: '0 10px' }}>
              {res.icon}
            </div>
            <h4 className="card-title">{res.title}</h4>
            <p className="card-desc">{res.desc}</p>
            <div className="card-action">{res.action}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
