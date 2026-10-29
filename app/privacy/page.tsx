import type { Metadata } from "next";
import { ArticlePage } from "@/components/site/article-page";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What Hop's servers see, what they keep, and what never leaves your browser.",
};

export default function PrivacyPage() {
  return (
    <ArticlePage
      title="Privacy"
      lede="Hop is built so there's very little to tell you about. Here is all of it."
    >
      <h2>Your files and text</h2>
      <p>
        Files and text go directly between browsers over WebRTC data channels, which are encrypted with DTLS.
        They are <strong>never uploaded</strong> to a Hop server, and Hop has no storage to keep them in. File names
        and sizes travel the same encrypted path, so the server doesn&rsquo;t see those either.
      </p>
      <p>
        If a TURN relay is used because a direct route isn&rsquo;t possible, it forwards encrypted packets it
        can&rsquo;t read.
      </p>

      <h2>What the signaling server handles</h2>
      <ul>
        <li>The room code and whether the room is locked.</li>
        <li>The display name each person chooses. You can use any name you like.</li>
        <li>
          Connection setup messages (SDP offers, answers and ICE candidates). These include network addresses, which
          is how browsers find each other.
        </li>
      </ul>
      <p>
        All of this lives <strong>in memory only</strong> while the room is open. Nothing is written to a database
        or to disk, and it&rsquo;s gone when the room ends.
      </p>

      <h2>In your browser</h2>
      <ul>
        <li>
          <strong>Your name and preferences</strong> (like auto-accept) are saved in local storage so you
          don&rsquo;t retype them.
        </li>
        <li>
          <strong>A seat key</strong> for the room you&rsquo;re in is kept in session storage so a refresh can
          rejoin. It disappears when you close the tab.
        </li>
        <li>
          <strong>Received files</strong> stay in the tab&rsquo;s memory until you save them or leave the page.
        </li>
      </ul>

      <h2>Analytics</h2>
      <p>
        This site uses Vercel Web Analytics to count page views. It doesn&rsquo;t use cookies and doesn&rsquo;t see
        anything you send.
      </p>

      <h2>No accounts</h2>
      <p>
        There&rsquo;s nothing to sign up for, so there&rsquo;s no email address, password or profile to protect.
      </p>
    </ArticlePage>
  );
}
