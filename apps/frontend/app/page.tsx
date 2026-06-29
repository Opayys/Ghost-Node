"use client";
import dynamic from "next/dynamic";
import Navbar      from "./components/Navbar";
import Hero        from "./components/sections/Hero";
import HowItWorks  from "./components/sections/HowItWorks";
import LiveStats   from "./components/sections/LiveStats";
import Marketplace from "./components/sections/Marketplace";
import TechStack   from "./components/sections/TechStack";

const ParticleNetwork = dynamic(() => import("./components/3d/ParticleNetwork"), { ssr: false });

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#050810]">
      <ParticleNetwork />
      <Navbar />
      <Hero />
      <HowItWorks />
      <LiveStats />
      <Marketplace />
      <TechStack />

      <footer className="border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">👻</span>
            <span className="font-display font-bold text-white">GhostNode</span>
            <span className="text-slate-600 text-sm">— BlockDev ID Hackathon 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a
              href="https://github.com/Opayys/Ghost-Node"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
            <span>Built by Naufal — Universitas Dinamika Bangsa, Jambi</span>
          </div>
        </div>
      </footer>
    </main>
  );
}