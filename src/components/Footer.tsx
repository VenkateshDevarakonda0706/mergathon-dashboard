import {
  Facebook,
  Linkedin,
  Twitter,
  Github,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">

        {/* Left Section */}
        <div className="footer-brand-section">

          <div className="footer-brand">

          

            <span className="footer-brand-name">
              CircuitVerse
            </span>

          </div>

          <p className="footer-description">
            CircuitVerse is an open-source educational digital circuit
            simulator that lets users design and simulate circuits
            through an intuitive graphical interface.
          </p>

          {/* Social Icons */}
          <div className="footer-social">

            {/* Facebook */}
            <a
              href="https://www.facebook.com/CircuitVerse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <Facebook size={22} />
            </a>

            {/* Twitter/X */}
            <a
              href="https://x.com/CircuitVerse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <Twitter size={22} />
            </a>

            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/company/circuitverse/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
            >
              <Linkedin size={22} />
            </a>

            {/* Slack */}
            <a
              href="https://circuitverse-team.slack.com/?redir=%2Fssb%2Fredirect"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Slack"
            >
              <img
                src="/slack.png"
                alt="Slack"
                className="footer-slack-icon"
              />
            </a>

            {/* GitHub */}
            <a
              href="https://github.com/CircuitVerse"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <Github size={22} />
            </a>

          </div>
        </div>

        {/* Middle Section */}
        <div className="footer-links-section">

          <h3>PAGES</h3>

          <div className="footer-links">
            <a href="/">Home</a>
            <a href="/leaderboard">Leaderboard</a>
            <a href="/teams">Analytics</a>
          </div>

        </div>

        {/* Right Section */}
        <div className="footer-status-section">

          <h3>SYSTEM STATUS</h3>

          <div className="footer-status-card">

            <div className="status-top">

              <span className="status-dot"></span>

              <div>
                <h4>Leaderboard Active</h4>

                <p>
                  Scrapes data frequently
                </p>
              </div>

            </div>

            <div className="status-divider"></div>

            <p className="status-update">
              Updated daily
            </p>

          </div>

          <a
            href="https://github.com/CircuitVerse/mergathon-dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-stats-link"
          >
            View full stats →
          </a>

        </div>

      </div>

      {/* Bottom */}
      <div className="footer-bottom">

        <p>
          © {new Date().getFullYear()} CircuitVerse.
          All rights reserved.
        </p>

        <div className="footer-bottom-links">

          <a
            href="https://circuitverse.org/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>

          <a
            href="https://circuitverse.org/tos"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </a>

        </div>

      </div>
    </footer>
  );
}