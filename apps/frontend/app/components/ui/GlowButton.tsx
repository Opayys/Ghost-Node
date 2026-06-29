"use client";
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlowButtonProps {
  children:  ReactNode;
  onClick?:  () => void;
  href?:     string;
  variant?:  "primary" | "secondary" | "ghost";
  size?:     "sm" | "md" | "lg";
  external?: boolean;
}

export default function GlowButton({
  children,
  onClick,
  href,
  variant  = "primary",
  size     = "md",
  external = false,
}: GlowButtonProps) {
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const variants = {
    primary:   { base: "bg-indigo-600 text-white border border-indigo-500",       glow: "rgba(99,102,241,0.5)"  },
    secondary: { base: "bg-transparent text-cyan-400 border border-cyan-500",     glow: "rgba(34,211,238,0.3)"  },
    ghost:     { base: "bg-transparent text-slate-300 border border-slate-700",   glow: "rgba(99,102,241,0.2)"  },
  };

  const v = variants[variant];

  const inner = (
    <motion.span
      className={`
        relative inline-flex items-center gap-2 rounded-xl font-medium
        font-display cursor-pointer overflow-hidden
        ${sizes[size]} ${v.base}
        transition-colors duration-200
      `}
      whileHover={{ scale: 1.02, boxShadow: `0 0 30px ${v.glow}, 0 0 60px ${v.glow}` }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.span
        className="absolute inset-0 opacity-0"
        style={{ background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)" }}
        initial={{ x: "-100%" }}
        whileHover={{ x: "100%", opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.span>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        onClick={onClick}
      >
        {inner}
      </a>
    );
  }

  return (
    <button onClick={onClick} className="inline-flex">
      {inner}
    </button>
  );
}