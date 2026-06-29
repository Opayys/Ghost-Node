"use client";
import { motion } from "framer-motion";
import { STATS } from "../../lib/constants";
import StatCounter from "../ui/StatCounter";

export default function LiveStats() {
  return (
    <section className="section-padding relative">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 100%)",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 text-slate-500 text-xs font-mono mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            LIVE STATS — ANVIL LOCAL
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white">
            Protocol Activity
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card-ghost p-8 text-center group"
            >
              <div className="font-display text-4xl md:text-5xl font-bold mb-2 gradient-text">
                <StatCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">
                {stat.label}
              </div>
              {/* Bottom glow line */}
              <motion.div
                className="mt-4 h-px mx-auto"
                style={{ background: "linear-gradient(90deg, transparent, #6366f1, transparent)" }}
                initial={{ width: "0%" }}
                whileInView={{ width: "80%" }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.8 }}
              />
            </motion.div>
          ))}
        </div>

        {/* Contract addresses */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-6 rounded-2xl border border-slate-800 bg-slate-900/50"
        >
          <div className="text-xs text-slate-500 font-mono mb-4 uppercase tracking-wider">
            Deployed Contracts — Anvil Local (Chain 31337)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { name: "AgentRegistry",      addr: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0" },
              { name: "TaskEscrow",         addr: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707" },
              { name: "ReputationContract", addr: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9" },
              { name: "DisputeResolver",    addr: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9" },
            ].map((c) => (
              <div key={c.name} className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-800/50">
                <span className="text-sm text-slate-400">{c.name}</span>
                <span className="font-mono text-xs text-indigo-400 truncate">{c.addr}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}