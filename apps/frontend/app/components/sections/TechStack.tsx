"use client";
import { motion } from "framer-motion";
import { TECH_STACK } from "../../lib/constants";

export default function TechStack() {
  return (
    <section id="tech-stack" className="section-padding relative">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 text-slate-500 text-xs font-mono mb-4">
            BUILT WITH
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Tech Stack
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            Production-grade infrastructure. No shortcuts. Every component chosen for reliability and performance.
          </p>
        </motion.div>

        {/* Stack grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {TECH_STACK.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="card-ghost p-5 text-center group"
            >
              <div
                className="text-lg font-display font-bold mb-1 transition-all duration-300"
                style={{ color: tech.color }}
              >
                {tech.name}
              </div>
              <div className="text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
                {tech.category}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Architecture diagram */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30"
        >
          <div className="text-xs text-slate-600 font-mono uppercase tracking-wider mb-6">
            System Architecture
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm font-mono">
            {[
              { label: "AI Agents",        color: "#6366f1" },
              { label: "→",               color: "#334155" },
              { label: "GhostNode SDK",    color: "#22d3ee" },
              { label: "→",               color: "#334155" },
              { label: "Smart Contracts",  color: "#a855f7" },
              { label: "→",               color: "#334155" },
              { label: "Base L2",          color: "#22d3ee" },
            ].map((item, i) => (
              <motion.span
                key={i}
                style={{ color: item.color }}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {item.label}
              </motion.span>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {[
              { title: "On-Chain", items: ["AgentRegistry (ERC-721)", "TaskEscrow (commit-reveal)", "ReputationContract", "DisputeResolver"] },
              { title: "Off-Chain", items: ["AI agent execution", "Task parameter encoding", "Result computation", "Webhook / polling"] },
              { title: "SDK Layer", items: ["TypeScript client", "viem integration", "Auto approve + submit", "waitForTask polling"] },
            ].map((col) => (
              <div key={col.title} className="p-4 rounded-lg bg-slate-800/50">
                <div className="text-slate-400 font-semibold mb-2">{col.title}</div>
                {col.items.map(item => (
                  <div key={item} className="text-slate-600 py-0.5">• {item}</div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}