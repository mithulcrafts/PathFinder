import React from 'react';

export default function QuickStart() {
  const actions = [
    {
      icon: "APK",
      title: "Download APK",
      desc: "Get the mobile app client to browse, visualize, and share career journeys.",
      href: "#try-pathfinder",
      isAnchor: true
    },
    {
      icon: "▶",
      title: "Watch Demo Video",
      desc: "Watch a 3-minute walkthrough explaining the product features and UI.",
      href: "https://www.youtube.com/watch?v=cFn0jj-MVC8",
      isAnchor: false
    },
    {
      icon: "</>",
      title: "Explore GitHub Code",
      desc: "Browse the repository containing our Expo mobile app, Node.js backend, and AI pipeline.",
      href: "https://github.com/mithulcrafts/PathFinder",
      isAnchor: false
    }
  ];

  const handleClick = (e, action) => {
    if (action.isAnchor) {
      e.preventDefault();
      const targetId = action.href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="section" id="quick-start">
      <div className="section-header">
        <h2 className="section-title">Start <span className="accent">Here</span></h2>
        <p className="section-subtitle">
          Jump straight into the PathFinder platform, source code, and video demonstrations.
        </p>
      </div>

      <div className="quick-start-grid">
        {actions.map((action, idx) => (
          <a
            key={idx}
            href={action.href}
            className="quick-card"
            onClick={(e) => handleClick(e, action)}
            target={action.isAnchor ? undefined : "_blank"}
            rel={action.isAnchor ? undefined : "noopener noreferrer"}
          >
            <div className="quick-icon" style={{ fontSize: '12px', fontFamily: 'var(--mono)', fontWeight: 'bold' }}>
              {action.icon}
            </div>
            <div className="quick-info">
              <h4>{action.title}</h4>
              <p>{action.desc}</p>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
