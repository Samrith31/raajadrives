import { HiScale, HiMail, HiShieldCheck, HiChevronLeft } from 'react-icons/hi';
import Link from 'next/link';

export default function DMCAPage() {
  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-20 relative overflow-hidden isolate">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full -z-10" />
      
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-500 hover:text-red-500 transition-colors text-[10px] font-black uppercase tracking-[0.3em] mb-12 group"
        >
          <HiChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Return to Drive
        </Link>

        <header className="mb-16">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-4 bg-red-600 rounded-2xl shadow-2xl shadow-red-900/40">
              <HiScale size={32} />
            </div>
            <div className="h-px w-20 bg-white/10" />
            <span className="font-mono text-sm tracking-[0.5em] text-neutral-500 font-bold uppercase">
              Legal / Rights
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter leading-none mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500">
            Copyright <br /> & DMCA Notice
          </h1>
        </header>

        <section className="space-y-12">
          {/* Ownership Statement */}
          <div className="bg-neutral-900/50 border border-white/5 p-8 rounded-[2rem] backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4 text-red-500">
              <HiShieldCheck size={20} />
              <span className="text-xs font-black uppercase tracking-widest">Ownership & Rights</span>
            </div>
            <p className="text-lg text-neutral-300 leading-relaxed italic">
              &quot;I do not own any of the music hosted on this platform. All rights belong solely to <strong>Maestro Ilaiyaraaja</strong>. This project is established as a non-commercial archive dedicated to preserving the high-quality musical legacy of the Maestro and fostering social engagement with the current generation.&quot;
            </p>
          </div>

          {/* Takedown Procedure */}
          <div className="border-l-2 border-red-600 pl-8 py-4">
            <h2 className="text-xl font-bold uppercase tracking-widest mb-4">Content Takedown Request</h2>
            <p className="text-neutral-400 mb-6 leading-relaxed">
              We respect the intellectual property of creators. If you represent the rights holder and require your content to be removed from this web directory, please contact the administrator immediately.
            </p>
            
            <a 
              href="mailto:raajadrives31@gmail.com" 
              className="inline-flex items-center gap-4 px-8 py-4 bg-white text-black rounded-2xl hover:bg-red-600 hover:text-white transition-all duration-300 group"
            >
              <HiMail size={20} />
              <span className="font-black uppercase tracking-tighter text-sm">raajadrives31@gmail.com</span>
            </a>
            
            <p className="mt-6 text-[10px] text-neutral-600 uppercase font-bold tracking-[0.2em]">
              Verified removal will be processed within 24-48 hours of contact.
            </p>
          </div>
        </section>

        <footer className="mt-32 pt-12 border-t border-white/5">
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.5em] font-medium text-center">
           RaajaDrives © {new Date().getFullYear()} — Non-Profit Preservation
          </p>
        </footer>
      </div>
    </main>
  );
}