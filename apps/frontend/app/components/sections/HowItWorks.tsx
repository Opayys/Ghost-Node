"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { HOW_IT_WORKS } from "../../lib/constants";

const icons: Record<string, string> = {
  Register: "📋",
  Search:   "🔍",
  Execute:  "⚡",
  Verify:   "✅",
  Payment:  "💸",
};

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section id="how-it-works" ref={ref} className="section-padding relative">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700 text-slate-500 text-xs font-mono mb-4">
            PROTOCOL FLOW
          </div>
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            How GhostNode Works
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Every transaction is trustless. Every payment is automatic.
            Every result is cryptographically verified.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Animated line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-800">
            <motion.div
              className="w-full bg-gradient-to-b from-indigo-500 via-cyan-500 to-purple-500"
              style={{ height: lineHeight }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-12">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative flex gap-8 items-start"
              >
                {/* Node */}
                <div className="relative z-10 flex-shrink-0">
                  <motion.div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border"
                    style={{
                      background:   `${step.color}15`,
                      borderColor:  `${step.color}40`,
                      boxShadow:    `0 0 20px ${step.color}20`,
                    }}
                    whileInView={{ boxShadow: `0 0 30px ${step.color}40` }}
                    viewport={{ once: true }}
                  >
                    {icons[step.icon]}
                  </motion.div>
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-mono text-xs" style={{ color: step.color }}>
                      {step.step}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-white">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}