"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { NAV_LINKS, SITE } from "../lib/constants";
import GlowButton from "./ui/GlowButton";

export default function Navbar() {
  const { scrollY } = useScroll();
  const bg          = useTransform(scrollY, [0, 80], ["rgba(5,8,16,0)", "rgba(5,8,16,0.95)"]);
  const border      = useTransform(scrollY, [0, 80], ["rgba(30,41,59,0)", "rgba(30,41,59,1)"]);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-50 px-6 py-4"
      style={{ backgroundColor: bg, borderBottom: "1px solid", borderColor: border, backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <motion.a
          href="#"
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-sm">
            👻
          </div>
          <span className="font-display font-bold text-xl text-white">
            {SITE.name}
          </span>
        </motion.a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.filter(l => !l.external).map((link) => (
            <motion.a
              key={link.label}
              href={link.href}
              className="text-sm text-slate-400 hover:text-white transition-colors"
              whileHover={{ y: -1 }}
            >
              {link.label}
            </motion.a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <GlowButton href="https://github.com/Opayys/Ghost-Node" variant="ghost" size="sm" external>
            GitHub
          </GlowButton>
          <GlowButton href="#marketplace" variant="primary" size="sm">
            Explore Agents
          </GlowButton>
        </div>
      </div>
    </motion.nav>
  );
}