
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";

const features = [
  "Contractor compliance tracking",
  "Document expiry monitoring",
  "Compliance reporting",
  "Audit-ready activity history",
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/dashboard";
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-6xl grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1.1fr_0.9fr] min-h-0 lg:min-h-[600px]">
        
        {/* LEFT PANEL - With Curved Shape */}
        <section className="relative overflow-hidden bg-[var(--navy)] p-8 sm:p-12 text-white hidden lg:flex flex-col justify-between">
          
          {/* The curved shape trick */}
          <div className="absolute top-0 right-0 w-[150%] h-[120%] bg-white opacity-[0.03] rounded-b-[50%] transform translate-x-1/4 -translate-y-1/4"></div>

          <div className="relative z-10 flex flex-col items-center text-center mt-8">
            <img 
              src="/logo.webp" 
              alt="ComplyTrack" 
              className="h-28 sm:h-32 w-auto object-contain mb-12 transition-transform duration-300 ease-in-out hover:scale-110 cursor-pointer" 
              style={{ mixBlendMode: 'screen' }} 
            />
            
            <h1 className="mt-3 max-w-lg text-4xl font-extrabold tracking-tight text-[var(--teal-2)] leading-tight">
              Secure access to the contractor compliance workspace.
            </h1>

            <div className="mt-12 space-y-4 text-left w-full max-w-sm mx-auto">
              {features.map((feature, index) => (
                <div 
                  key={feature} 
                  className="flex items-center gap-3 text-sm text-slate-200 opacity-0 animate-[slideIn_0.5s_ease-out_forwards]"
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <CheckCircle2 size={18} className="shrink-0 text-[var(--teal-2)]" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative z-10 mt-12 text-center text-xs text-slate-400">
             Built for South African organisations By South African developers
          </div>
        </section>

        {/* RIGHT PANEL - Form */}
        <section className="p-6 sm:p-12 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/logo.webp" alt="ComplyTrack" className="h-20 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center lg:text-left">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500 text-center lg:text-left">Use the account your administrator created.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="email" required placeholder="you@company.com" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 transition-all" />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                  <input type="checkbox" className="rounded border-slate-300 text-[var(--navy)] focus:ring-[var(--navy)]" />
                  Remember me
                </label>
                <a href="#" className="font-semibold text-[var(--navy)] hover:underline">Forgot password?</a>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--navy)] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#083525] disabled:opacity-70"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></span>
                {isLoading ? "Signing in..." : "Sign in"}
                {!isLoading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            {/* Added the Sign Up link here */}
            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account? <Link to="/signup" className="font-bold text-[var(--navy)] hover:underline">Sign up</Link>
            </p>

          </div>
        </section>
      </div>

      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </main>
  );
}