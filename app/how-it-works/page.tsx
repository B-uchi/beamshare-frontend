import type { Metadata } from "next";
import Link from "next/link";
import { ArticlePage } from "@/components/site/article-page";

export const metadata: Metadata = {
  title: "How it works",
  description: "How Hop moves files directly between browsers with WebRTC, and what the signaling server does.",
};

export default function HowItWorksPage() {
  return (
    <ArticlePage
      title="How it works"
      lede="Hop is a thin introduction service and a direct line. Here's what happens between you choosing a file and it arriving on the other side."
    >
      <h2>The short version</h2>
      <p>
        When you open a room, your browser connects to a small <strong>signaling server</strong> and gets a code.
        When someone joins with that code, the server introduces your two browsers. They work out how to reach each
        other, then open an encrypted <strong>WebRTC data channel</strong> between them. Files and text travel over
        that channel and never touch the server.
      </p>

      <h2>Finding each other</h2>
      <p>
        Two browsers on the internet usually can&rsquo;t see each other directly. Each sits behind a home router,
        office firewall or mobile network. To get around that, each browser asks a public <strong>STUN</strong>{" "}
        server &ldquo;what address do I appear from?&rdquo; and shares the answer, along with its local addresses, as
        <em> ICE candidates</em>. The signaling server passes these between you. The browsers then try candidate
        pairs until one works.
      </p>
      <p>
        Every room is a full mesh: each person has their own direct link to everyone else. That&rsquo;s why anyone in
        a room can send to anyone, and why a file sent to one person isn&rsquo;t seen by the others.
      </p>

      <h2>When a direct route isn&rsquo;t possible</h2>
      <p>
        Some networks, especially strict corporate firewalls and some mobile carriers, block direct connections
        entirely. In that case a <strong>TURN relay</strong> can forward the traffic. Hop uses one if the deployment has
        one configured, and shows <em>Connected via relay</em> next to that person. The relay only ever handles
        encrypted packets it can&rsquo;t read.
      </p>

      <h2>Sending a file</h2>
      <ul>
        <li>Hop offers the file to the recipient with its name, size and type.</li>
        <li>
          Their browser accepts it automatically, or asks them first if they&rsquo;ve turned off{" "}
          <strong>Accept files automatically</strong>.
        </li>
        <li>
          The file streams in 64&nbsp;KB pieces. Hop watches how much is buffered on the channel and pauses reading
          when the network can&rsquo;t keep up, so large files don&rsquo;t flood memory on the sending side.
        </li>
        <li>
          When the last piece lands, the recipient&rsquo;s browser assembles the file and confirms delivery. Only then
          does the sender see <strong>Delivered</strong>.
        </li>
      </ul>
      <p>
        Files sent to the same person go one after another. Files to different people move in parallel.
      </p>

      <h2>Staying connected</h2>
      <p>
        Networks drop. Phones sleep, Wi-Fi hands over to mobile data, and tabs get refreshed. Hop treats all of this
        as normal:
      </p>
      <ul>
        <li>
          Each tab keeps a private seat key for its room. After a refresh it quietly reclaims the same seat, with
          the same name and place on the line.
        </li>
        <li>
          The server holds a disconnected person&rsquo;s seat for 30 seconds. If the host is away longer than that,
          the room closes.
        </li>
        <li>
          The connection to the server is checked every few seconds and reopened with back-off when it drops,
          immediately when the browser comes back online or the tab becomes visible.
        </li>
        <li>Links between browsers that fail are redialled automatically. Queued files wait and then continue.</li>
      </ul>

      <h2>Limits worth knowing</h2>
      <ul>
        <li>
          <strong>Both sides must be online at once.</strong> Nothing is stored for later.
        </li>
        <li>
          <strong>Memory.</strong> Received files are held in browser memory until you save them, so very large
          files are limited by the receiving device.
        </li>
        <li>
          <strong>Room size.</strong> Up to 16 people. Every person links to every other, so big rooms ask a lot
          of each device.
        </li>
        <li>
          <strong>An interrupted file starts over.</strong> If a link drops mid-file, that file is marked failed and
          you can send it again.
        </li>
      </ul>

      <p>
        Ready? <Link href="/new">Start a room</Link>.
      </p>
    </ArticlePage>
  );
}
