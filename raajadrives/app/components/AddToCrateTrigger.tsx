'use client';

import { useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import AddToCrateModal from './AddToCrateModal';

interface Props {
  releaseId: string;
  title: string;
}

export default function AddToCrateTrigger({ releaseId, title }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="
          group relative flex items-center justify-center
          w-64 h-18
          rounded-2xl
          border border-white/20
          bg-gradient-to-b from-neutral-900/90 via-neutral-900/60 to-black/80
          backdrop-blur-2xl
          shadow-[0_25px_60px_rgba(0,0,0,0.95)]
          overflow-hidden
          transition-all duration-500 ease-out
          hover:shadow-[0_0_60px_rgba(248,113,113,0.6)]
          hover:border-red-500/70
          hover:-translate-y-1 hover:scale-[1.02]
          active:scale-[0.98]
        "
      >
        {/* Outer glow aura */}
        <div className="
          pointer-events-none absolute inset-0
          opacity-0 group-hover:opacity-100
          transition-opacity duration-700
        ">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(248,113,113,0.25),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(239,68,68,0.15),transparent_50%)]" />
        </div>

        {/* Vinyl Record - Fixed positioning */}
        <div className="
          absolute left-4
          w-12 h-12
          rounded-full
          bg-black/95
          border-[3px] border-neutral-700/90
          flex items-center justify-center
          shadow-[0_0_25px_rgba(0,0,0,0.95)]
          transition-all duration-800 ease-out
          group-hover:rotate-[360deg] group-hover:scale-110
          group-hover:shadow-[0_0_35px_rgba(248,113,113,0.7)]
        ">
          {/* Vinyl reflection */}
          <div className="absolute top-1 left-1 w-6 h-6 rounded-full bg-white/8 blur-sm" />

          {/* Grooves */}
          <div className="absolute inset-0 rounded-full opacity-50 bg-[repeating-radial-gradient(circle,transparent_0px,transparent_1px,#444_2px,#333_3px)]" />

          {/* Center pulse */}
          <div className="
            absolute w-8 h-8 rounded-full border-2 border-red-500/40
            scale-75 group-hover:scale-100 opacity-70 group-hover:opacity-100
            transition-all duration-500
          " />

          {/* Center label */}
          <div className="
            w-5 h-5 rounded-full bg-gradient-to-r from-red-600 to-red-700
            flex items-center justify-center z-10
            shadow-[0_0_15px_rgba(248,113,113,0.9)]
          ">
            <HiPlus className="text-[11px] text-white font-bold" />
          </div>
        </div>

        {/* Text - Perfect spacing */}
        <div className="flex flex-col items-start ml-16 z-20 pr-4">
          <span className="
            text-sm font-black text-white/95
            uppercase tracking-[0.3em] italic leading-none
            group-hover:text-red-300 group-hover:tracking-[0.4em]
            transition-all duration-500
          ">
            Add to Crate
          </span>
          <div className="
            h-[2px] w-24 bg-gradient-to-r from-transparent via-red-500/80 to-red-400
            scale-x-0 origin-left group-hover:scale-x-100
            transition-transform duration-600 delay-200
          " />
        </div>

        {/* Diagonal light sweep */}
        <div className="
          pointer-events-none absolute inset-0
          bg-gradient-to-r from-transparent via-white/15 to-transparent
          translate-x-[-120%] group-hover:translate-x-[120%]
          transition-transform duration-1200 ease-out
        " />

        {/* Red aura overlay */}
        <div className="
          pointer-events-none absolute inset-0
          bg-[radial-gradient(ellipse_at_center,rgba(248,113,113,0.12),transparent_70%)]
          opacity-0 group-hover:opacity-100 blur-sm
          transition-all duration-800
          mix-blend-screen
        " />
      </button>

      <AddToCrateModal
        releaseId={releaseId}
        releaseTitle={title}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
