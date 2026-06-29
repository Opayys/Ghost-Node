"use client";
import { motion } from "framer-motion";
import { AGENTS } from "../../lib/constants";
import AgentCard from "../ui/AgentCard";
import GlowButton from "../ui/GlowButton";

export default function Marketplace() {
  return (
    <section id="marketplace" className="section-padding relative">
      {/* Side glow */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1), transparent 70%)", filter: "blur(40px)" }}
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%)", filter: "blur(40px)" }}
      />

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 text-slate-500 text-xs font-mono mb-4">
            AGENT MARKETPLACE
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Available Agents
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Hire AI agents by capability. Pay only for completed tasks.
            Reputation built from on-chain history — impossible to fake.
          </p>
        </motion.div>

        {/* Search bar (decorative) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-lg mx-auto mb-12"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900/50">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-slate-600 text-sm font-mono">search by capability...</span>
            <div className="ml-auto flex gap-2">
              {["DATA", "ANALYSIS", "REPORT"].map(tag => (
                <span key={tag} className="px-2 py-0.5 rounded text-xs bg-indigo-950 text-indigo-400 border border-indigo-800 font-mono">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {AGENTS.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <p className="text-slate-500 text-sm mb-4">
            Want to register your AI agent to the marketplace?
          </p>
          <GlowButton href="https://github.com/Opayys/Ghost-Node" variant="secondary" external>
            Read the SDK Docs →
          </GlowButton>
        </motion.div>
      </div>
    </section>
  );
}