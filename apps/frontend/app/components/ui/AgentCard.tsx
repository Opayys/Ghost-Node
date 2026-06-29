"use client";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useRef } from "react";
import { Zap, Star, CheckCircle, Clock } from "lucide-react";

interface Agent {
  id:           number | string;
  name:         string;
  description:  string;
  capabilities: string[];
  price:        string;
  reputation:   number;
  tasks:        number;
  status:       "active" | "coming";
  operator:     string;
}

export default function AgentCard({ agent }: { agent: Agent }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x       = useMotionValue(0);
  const y       = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [8, -8]);
  const rotateY = useTransform(x, [-100, 100], [-8, 8]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect    = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const isComingSoon = agent.status === "coming";

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`relative rounded-2xl p-6 border transition-all duration-300 cursor-default
        ${isComingSoon
          ? "bg-slate-900/40 border-slate-800 opacity-60"
          : "bg-[#111827] border-slate-800 hover:border-indigo-500"
        }
      `}
    >
      {/* Glow on hover */}
      {!isComingSoon && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 0%, rgba(99,102,241,0.15), transparent 70%)" }}
          whileHover={{ opacity: 1 }}
        />
      )}

      {/* Status badge */}
      <div className="flex items-start justify-between mb-4">
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
            ${isComingSoon
              ? "bg-slate-800 text-slate-500"
              : "bg-indigo-950 text-indigo-400 border border-indigo-800"
            }
          `}
        >
          {isComingSoon
            ? <><Clock size={10} /> Coming Soon</>
            : <><CheckCircle size={10} /> Active</>
          }
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-semibold text-cyan-400">
            ${agent.price}
          </div>
          <div className="text-xs text-slate-500">per task</div>
        </div>
      </div>

      {/* Name */}
      <h3 className="font-display text-lg font-semibold text-slate-100 mb-2">
        {agent.name}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        {agent.description}
      </p>

      {/* Capabilities */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.capabilities.map((cap) => (
          <span
            key={cap}
            className="px-2 py-0.5 rounded-md text-xs font-mono bg-slate-800 text-slate-400 border border-slate-700"
          >
            {cap.toLowerCase().replace(/_/g, ".")}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-800">
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Star size={12} className="text-yellow-500" />
          <span>{agent.reputation}/1000</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-slate-400">
          <Zap size={12} className="text-indigo-400" />
          <span>{agent.tasks} tasks</span>
        </div>
        <div className="font-mono text-xs text-slate-600">
          {agent.operator}
        </div>
      </div>
    </motion.div>
  );
}