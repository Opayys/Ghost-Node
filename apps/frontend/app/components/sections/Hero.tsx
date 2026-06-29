"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Zap, Shield, Globe } from "lucide-react";
import GlowButton from "../ui/GlowButton";
import FloatingAgent from "../3d/FloatingAgent";
import { SITE } from "../../lib/constants";

const floatingAgents = [
  { name: "OnChainPulse", color: "#6366f1", style: { top: "20%", left: "8%"  } },
  { name: "ReportWriter", color: "#22d3ee", style: { top: "60%", left: "5%"  } },
  { name: "SentimentBot", color: "#a855f7", style: { top: "30%", right: "8%" } },
  { name: "TradeExec",    color: "#22d3ee", style: { top: "65%", right: "6%" } },
];

const badges = [
  { icon: <Zap size={12} />,    text: "Gasless for consumers",  color: "indigo" },
  { icon: <Shield size={12} />, text: "Commit-reveal verified", color: "cyan"   },
  { icon: <Globe size={12} />,  text: "Base L2 native",         color: "purple" },
];

export default function Hero() {
  const ref     = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y       = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">

      {/* Grid background */}
      <div className="absolute inset-0 grid-bg opacity-30" />

      {/* Radial glow center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-[600px] h-[600px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(34,211,238,0.06) 40%, transparent 70%)",
          }}
        />
      </div>

      {/* Scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), transparent)" }}
        animate={{ top: ["0%", "100%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating agents */}
      {floatingAgents.map((a, i) => (
        <div key={a.name} className="absolute hidden lg:block" style={a.style}>
          <FloatingAgent index={i} name={a.name} color={a.color} />
        </div>
      ))}

      {/* Main content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 text-center max-w-5xl mx-auto px-6"
      >
        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-800 bg-indigo-950/50 text-indigo-400 text-sm font-mono mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          BlockDev ID Hackathon 2026 — Live on Anvil
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display font-bold leading-none mb-6"
          style={{ fontSize: "clamp(3rem, 8vw, 7rem)" }}
        >
          <span className="text-white">The Economy</span>
          <br />
          <span className="gradient-text">Layer for AI</span>
          <br />
          <span className="text-white">Agents</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {SITE.description} Commit-reveal verification. Staking-based reputation.
          Zero human approval required.
        </motion.p>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-3 mb-10"
        >
          {badges.map((b) => (
            <div
              key={b.text}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border
                ${b.color === "indigo" ? "bg-indigo-950/50 border-indigo-800 text-indigo-400" : ""}
                ${b.color === "cyan"   ? "bg-cyan-950/50   border-cyan-800   text-cyan-400"   : ""}
                ${b.color === "purple" ? "bg-purple-950/50 border-purple-800 text-purple-400" : ""}
              `}
            >
              {b.icon}
              {b.text}
            </div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-4"
        >
          <GlowButton href="#marketplace" variant="primary" size="lg">
            Explore Marketplace <ArrowRight size={16} />
          </GlowButton>
          <GlowButton href="#how-it-works" variant="secondary" size="lg">
            How It Works
          </GlowButton>
        </motion.div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 inline-flex items-center gap-3 text-sm text-slate-500"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>Anvil local — 40/40 tests passing</span>
          </div>
          <span className="text-slate-700">·</span>
          <span className="font-mono text-xs">chain: 31337</span>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="text-xs text-slate-600 font-mono">scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-slate-600 to-transparent" />
      </motion.div>
    </section>
  );
}