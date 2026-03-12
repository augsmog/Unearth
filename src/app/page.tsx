import Link from "next/link";
import { LandingHero } from "@/components/landing/LandingHero";

export default function LandingPage() {
  return (
    <div style={{ background: "var(--bg-primary)" }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 h-14 flex items-center justify-between px-6 z-50" style={{ background: "var(--bg-primary)" }}>
        <span
          className="text-lg tracking-[0.25em] uppercase"
          style={{
            color: "var(--text-primary)",
            fontFamily: "var(--font-rajdhani), sans-serif",
            fontWeight: 700,
          }}
        >
          unearthed
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm"
            style={{ color: "var(--text-secondary)" }}
          >
            Log in
          </Link>
          <Link
            href="/discover"
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ background: "var(--accent-primary)", color: "white" }}
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <LandingHero />

      {/* How it works */}
      <section className="px-6 py-20 max-w-4xl mx-auto">
        <h2
          className="text-2xl md:text-3xl font-bold text-center mb-12"
          style={{ color: "var(--text-primary)" }}
        >
          How it works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Open a pack",
              description:
                "Choose from three pack types and reveal 5 curated websites hand-picked for your interests.",
            },
            {
              step: "02",
              title: "Keep your favorites",
              description:
                "Swipe through the cards, preview each site, and keep up to 3 that catch your eye.",
            },
            {
              step: "03",
              title: "Build your collection",
              description:
                "Organize finds into boards, share them publicly, and discover what others have found.",
            },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div
                className="text-4xl font-bold mb-3"
                style={{ color: "var(--accent-primary)", opacity: 0.5 }}
              >
                {item.step}
              </div>
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {item.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--text-secondary)" }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Positioning */}
      <section className="px-6 py-20" style={{ background: "var(--bg-surface)" }}>
        <div className="max-w-2xl mx-auto text-center">
          <h2
            className="text-2xl md:text-3xl font-bold mb-6"
            style={{ color: "var(--text-primary)" }}
          >
            The internet used to be fun to explore
          </h2>
          <p
            className="text-base leading-relaxed mb-4"
            style={{ color: "var(--text-secondary)" }}
          >
            No algorithms. No infinite scroll. No AI-generated filler. Just
            interesting websites, one pack at a time.
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Every site in Unearth is reviewed for quality by real humans. We
            score for originality, design, and authentic human presence.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <h2
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: "var(--text-primary)" }}
        >
          Ready to explore?
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
          Open your first pack and discover websites you&apos;d never find on
          your own.
        </p>
        <Link
          href="/discover"
          className="inline-block px-8 py-3 rounded-xl text-base font-bold"
          style={{
            background: "var(--accent-primary)",
            color: "white",
            boxShadow: "0 8px 32px rgba(233, 69, 96, 0.4)",
          }}
        >
          Start Exploring
        </Link>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-8 text-center"
        style={{ borderTop: "1px solid var(--border-subtle)" }}
      >
        <span
          className="text-sm tracking-[0.15em] uppercase"
          style={{
            color: "var(--text-muted)",
            fontFamily: "var(--font-rajdhani), sans-serif",
            fontWeight: 600,
          }}
        >
          unearthed
        </span>
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          Unearth the internet.
        </p>
      </footer>
    </div>
  );
}
