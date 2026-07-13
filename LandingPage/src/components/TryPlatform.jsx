import React from 'react';

export default function TryPlatform() {
  return (
    <section className="section" id="try-pathfinder" style={{ scrollMarginTop: '60px' }}>
      <div className="section-header">
        <h2 className="section-title">Try <span className="accent">PathFinder</span></h2>
        <p className="section-subtitle">
          Test the prototype. Get the apk or launch the web preview to query our seed knowledge graph.
        </p>
      </div>

      <div className="try-layout">
        {/* Android Client */}
        <div className="try-card primary-try">
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--mono)',
            fontWeight: 'bold',
            background: 'rgba(84, 214, 194, 0.1)',
            color: 'var(--mint)',
            padding: '4px 10px',
            borderRadius: '99px',
            letterSpacing: '0.08em'
          }}>
            App
          </div>
          <h3 className="try-title">APK (Recommended)</h3>
          <p className="try-desc">
            Download and install the official PathFinder application. Experience full AI-guided onboarding, voice queries transcribing in real time, and dynamic path visuals on your mobile device.
          </p>
          <a href="https://fmqx14c5dhhkcis9.public.blob.vercel-storage.com/pathfinder.apk" download className="try-btn btn-mint">
            Download APK ↗
          </a>
        </div>

        {/* Web Preview */}
        <div className="try-card">
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--mono)',
            fontWeight: 'bold',
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'var(--ink-dim)',
            padding: '4px 10px',
            borderRadius: '99px',
            letterSpacing: '0.08em'
          }}>
            WEB
          </div>
          <h3 className="try-title">Web Preview</h3>
          <p className="try-desc">
            Explore the interactive PathFinder platform directly in your web browser. Interact with the onboarding flow, search paths, and view experience charts without installing the app.
          </p>
          <a href="https://path-finder-webapp.vercel.app" target="_blank" rel="noopener noreferrer" className="try-btn btn-outline">
            Launch Web Preview↗
          </a>
        </div>
      </div>
    </section>
  );
}
