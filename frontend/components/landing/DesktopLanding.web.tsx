import { Asset } from 'expo-asset';
import { useFonts } from 'expo-font';
import { ArchivoNarrow_400Regular } from '@expo-google-fonts/archivo-narrow/400Regular';
import { ArchivoNarrow_700Bold } from '@expo-google-fonts/archivo-narrow/700Bold';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  JOURNEY_TAGS,
  LANG_CHIPS,
  PLATFORMS,
  QUESTIONS,
  TIMELINE,
} from './LandingSections';
import type { DesktopLandingProps } from './DesktopLanding';
import { TEAM_CONTACTS } from '../../constants/teamContacts';
import './desktopLanding.css';

const logo = Asset.fromModule(require('../../assets/logo-dark.png')).uri;
const wordmark = Asset.fromModule(require('../../assets/title-dark.png')).uri;
const google = Asset.fromModule(require('../../assets/google.png')).uri;

function Brand() {
  return (
    <>
      <img className="logo" src={logo} alt="" />
      <img className="name" src={wordmark} alt="PathFinder" />
    </>
  );
}

const steps = [
  {
    icon: 'help-circle',
    name: 'Ask',
    description: 'Describe the decision you’re facing.',
  },
  {
    icon: 'git-branch',
    name: 'Retrieve journeys',
    description: 'Find people who faced similar choices.',
  },
  {
    icon: 'trending-up',
    name: 'See patterns',
    description: 'Trace decisions across their timelines.',
  },
] as const;

function JourneyTimeline() {
  return (
    <section className="journey" aria-labelledby="timeline-title">
      <h2 id="timeline-title">
        Success isn't a moment.
        <br />
        It's a sequence of decisions.
      </h2>
      <ol>
        {TIMELINE.map((stage) => (
          <li key={stage.label}>
            <span
              className={'marker' + (stage.isFlag ? ' finish' : '')}
              aria-hidden="true"
            >
              {stage.isFlag && <Feather name="flag" size={13} color="white" />}
            </span>
            <div>
              <p className="stage">{stage.label}</p>
              <p className="quote">{stage.caption}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PlatformComparison() {
  return (
    <figure className="st-comparison">
      <h3>
        Every platform shows a piece.
        <br />
        PathFinder shows the whole picture.
      </h3>
      <ul className="st-platforms">
        {PLATFORMS.map((platform) => (
          <li className="st-platform" key={platform.name}>
            <MaterialCommunityIcons name={platform.icon} size={20} />
            <b>{platform.name}</b>
            <small>{platform.tag}</small>
          </li>
        ))}
      </ul>
      <div className="st-merge" aria-hidden="true">
        {PLATFORMS.map((p) => (
          <i key={p.name} />
        ))}
      </div>
      <div className="st-unified">
        <h4>
          <Feather name="shield" size={20} />
          Verified Journeys
        </h4>
        <ul className="st-tags">
          {JOURNEY_TAGS.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      </div>
    </figure>
  );
}

function LandingStory() {
  return (
    <div className="pf-story">
      <section>
        <div className="st-inner st-pair">
          <div>
            <p className="st-label">The problem</p>
            <h2 className="st-heading">
              The biggest decisions are often made with the least reliable
              information.
            </h2>
            <p className="st-copy">
              People jump between LinkedIn, Reddit, YouTube, blogs, and AI
              assistants for important decisions. Each platform shows a
              different fragment of someone’s journey.
            </p>
          </div>
          <PlatformComparison />
        </div>
      </section>
      <section id="sample-questions" className="st-questions">
        <div className="st-inner st-pair">
          <h2 className="st-heading">Ask questions that matter.</h2>
          <ul className="st-question-list">
            {QUESTIONS.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
        </div>
      </section>
      <section id="how-it-works" className="st-how">
        <div className="st-inner st-pair">
          <div>
            <p className="st-label">How it works</p>
            <h2 className="st-heading">
              Powered by journeys, not assumptions.
            </h2>
            <p className="st-copy">
              Each question searches a knowledge graph of human experiences.
              PathFinder finds similar milestones and shows how people reached
              different outcomes.
            </p>
          </div>
          <ol className="st-step-list">
            {steps.map((step) => (
              <li key={step.name}>
                <span className="st-step-icon">
                  <Feather name={step.icon} size={19} />
                </span>
                <b>{step.name}</b>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      <div className="st-inner st-trust-community">
        <section className="st-trust">
          <p className="st-label">Verification</p>
          <h2 className="st-heading">Trust begins with authenticity.</h2>
          <p className="st-copy">
            Verification checks the timeline and the person behind it. Setbacks
            and unconventional decisions belong in a journey, too.
          </p>
          <div className="st-trust-note">
            <Feather name="shield" size={24} />
            <div>
              <b>Verified narratives</b>
              <p>
                A verified experience records what happened, including failures.
              </p>
            </div>
          </div>
        </section>
        <section>
          <p className="st-label">Community</p>
          <h2 className="st-heading">
            Collective knowledge, not social networking.
          </h2>
          <p className="st-copy">
            One founder’s pivot can help another avoid a mistake. One student’s
            internship preparation can guide the next applicant.
          </p>
          <div className="st-network">
            {['Pivot', 'Entry', 'Insight', 'Growth'].map((label) => (
              <span key={label}>
                <i />
                {label}
              </span>
            ))}
          </div>
        </section>
      </div>
      <section className="st-access">
        <div className="st-inner st-pair">
          <div>
            <p className="st-label">Natural interaction</p>
            <h2 className="st-heading">Knowledge, accessible to everyone.</h2>
            <p className="st-copy">
              Ask questions by voice, receive insights in Indian languages, and
              listen to the answer.
            </p>
            <ul className="st-langs">
              {LANG_CHIPS.map((lang) => (
                <li key={lang}>{lang}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="st-a11y-feature">
              <Feather name="globe" size={20} />
              <div>
                <b>Native Support</b>
                <p>Read insights in your preferred language.</p>
              </div>
            </div>
            <div className="st-a11y-feature">
              <Feather name="volume-2" size={20} />
              <div>
                <b>Read Aloud</b>
                <p>Listen to spoken insights as you explore a journey.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <div className="st-closing">
      <section className="st-vision">
        <div className="st-inner">
          <p className="st-label">Our vision</p>
          <blockquote>
            Imagine if every important decision someone made could help another
            person make theirs.
          </blockquote>
          <p className="st-copy">
            PathFinder is building a living repository of verified human
            journeys to help people understand what others did, why, and what
            they learned.
          </p>
        </div>
      </section>
      <footer className="st-footer">
        <div className="st-inner">
          <div className="st-footer-brand">
            <Brand />
          </div>
          <p className="st-foot-line">
            Building collective wisdom through verified journeys.
          </p>
          <a
            className="st-footer-github"
            href="https://github.com/mithulcrafts/PathFinder"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="PathFinder on GitHub"
            title="PathFinder on GitHub"
          >
            <MaterialCommunityIcons name="github" size={26} color="#F6F3ED" />
          </a>
          <section className="st-contact" id="contact" aria-labelledby="contact-heading">
            <h2 id="contact-heading">Contact the team</h2>
            <div className="st-contact-grid">
              {TEAM_CONTACTS.map(member => (
                <div className="st-contact-person" key={member.email}>
                  <h3>
                    <a className="st-contact-name" href={member.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on LinkedIn`}>
                      {member.name} <Feather name="arrow-up-right" size={12} color="#C4C9D1" />
                    </a>
                  </h3>
                  <a href={member.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} on GitHub`}>
                    <MaterialCommunityIcons name="github" size={16} color="#C4C9D1" /> GitHub
                  </a>
                  <a href={`mailto:${member.email}`}>
                    <Feather name="mail" size={14} color="#C4C9D1" /> {member.email}
                  </a>
                </div>
              ))}
            </div>
          </section>
          <p className="st-tech">
            Powered by Expo, Neo4j, GraphRAG, Gemini, Groq and Sarvam AI.
          </p>
        </div>
      </footer>
      </div>
    </div>
  );
}

export default function DesktopLanding({ onPressGoogle }: DesktopLandingProps) {
  // Load these weights only when the desktop homepage is mounted.
  useFonts({ ArchivoNarrow_400Regular, ArchivoNarrow_700Bold });

  return (
    <main className="pf-landing">
      <div className="continuity">
        <header className="brandbar">
          <div className="brandrow wrap">
            <div className="brand">
              <Brand />
            </div>
            <nav className="links" aria-label="Page sections">
              <a href="#how-it-works">How it works</a>
              <a href="#sample-questions">Sample questions</a>
            </nav>
          </div>
        </header>
        <div className="hero wrap">
          <div>
            <h1>
              <span className="line">The search engine</span>{' '}
              <span className="line">
                for <span className="accent">human</span>
              </span>{' '}
              <span className="line accent">experiences.</span>
            </h1>
            <p className="lead">
              Learn from verified journeys of founders, professionals, and
              students who have faced the decision you’re considering.
            </p>
            <button type="button" className="login" onClick={onPressGoogle}>
              <img src={google} alt="" />
              Sign in with Google
            </button>
            <p className="legal">
              By continuing you agree to our Terms &amp; Privacy.
            </p>
          </div>
          <JourneyTimeline />
        </div>
      </div>
      <LandingStory />
    </main>
  );
}
