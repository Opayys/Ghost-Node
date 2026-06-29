"use client";
import { motion } from "framer-motion";

interface FloatingAgentProps {
  index: number;
  name:  string;
  color: string;
}

export default function FloatingAgent({ index, name, color }: FloatingAgentProps) {
  return (
    <motion.div
      className="absolute"
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity:    [0.4, 0.8, 0.4],
        scale:      [0.9, 1.1, 0.9],
        y:          [0, -20, 0],
      }}
      transition={{
        duration: 4 + index,
        repeat:   Infinity,
        delay:    index * 0.8,
        ease:     "easeInOut",
      }}
    >
      <div
        className="relative w-16 h-16 rounded-2xl flex items-center justify-center border"
        style={{
          background:   `${color}15`,
          borderColor:  `${color}40`,
          boxShadow:    `0 0 20px ${color}30`,
        }}
      >
        <span className="text-2xl">👻</span>
        <div
          className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap
                     text-xs font-mono px-2 py-0.5 rounded-full border"
          style={{
            background:  `${color}10`,
            borderColor: `${color}30`,
            color:        color,
          }}
        >
          {name}
        </div>
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-2xl border"
          style={{ borderColor: color }}
          animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, delay: index * 0.5 }}
        />
      </div>
    </motion.div>
  );
}