import "./global.css";
import { Inter, Space_Grotesk } from 'next/font/google';
import Link from 'next/link';
import SearchBar from '@/app/components/SearchBar';
import Footer from '@/app/components/footer';
import MobileNav from '@/app/components/MobileNav';

// --- AUTH IMPORTS ---
import { AuthProvider } from '@/app/context/AuthContext';
import NavbarAuth from '@/app/components/NavbarAuth';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter' 
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'], 
  variable: '--font-space' 
});

export const metadata = {
  title: 'raajadrives',
  description: 'music updates & releases',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="antialiased min-h-screen bg-neutral-950 text-white selection:bg-red-600 selection:text-white overflow-x-hidden">
        
        {/* Wrap everything in the Auth Context so user session is global */}
        <AuthProvider>
          
          {/* Background Ambience */}
          <div className="fixed inset-0 -z-10 bg-neutral-950">
            <div className="absolute -top-24 -left-24 h-[420px] w-[420px] sm:h-[500px] sm:w-[500px] rounded-full bg-red-900/20 blur-[100px]" />
            <div className="absolute -bottom-24 -right-24 h-[420px] w-[420px] sm:h-[500px] sm:w-[500px] rounded-full bg-blue-900/10 blur-[100px]" />
          </div>

          {/* Header */}
          <header className="sticky top-0 z-50 border-b border-white/5 bg-neutral-950/70 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              
              {/* Logo */}
              <Link href="/" className="group cursor-pointer flex items-center gap-2">
                <div className="flex gap-[3px] items-end h-4">
                  <span className="w-1 h-2 bg-red-600 rounded-sm animate-[pulse_1.2s_ease-in-out_infinite]" />
                  <span className="w-1 h-4 bg-red-600 rounded-sm animate-[pulse_0.9s_ease-in-out_infinite]" />
                  <span className="w-1 h-3 bg-red-600 rounded-sm animate-[pulse_1.5s_ease-in-out_infinite]" />
                </div>
                <h1 className="font-display text-lg sm:text-xl font-bold tracking-tight text-white group-hover:text-red-500 transition-colors duration-300">
                  raaja<span className="text-red-600 group-hover:text-white transition-colors duration-300">drives</span>
                </h1>
              </Link>

              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-400">
                <SearchBar />
                <Link href="/latest" className="hover:text-white transition-colors ml-2">Latest</Link>
                <Link href="/all" className="hover:text-white transition-colors">Archive</Link>
                
                {/* Dynamically switches between "Join Drive" 
                   and the user's "Username" based on session 
                */}
                <NavbarAuth />
              </nav>

            </div>
          </header>

          {/* Main content: Added pb-24 for mobile nav clearance */}
          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
            {children}
          </main>

          <Footer />

          {/* Persistent Mobile Navigation bar */}
          <MobileNav />

        </AuthProvider>
      </body>
    </html>
  );
}