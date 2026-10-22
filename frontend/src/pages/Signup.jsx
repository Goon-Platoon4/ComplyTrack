import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, User, Eye, EyeOff } from "lucide-react";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate backend delay
    setTimeout(() => {
      setIsLoading(false);
      window.location.href = "/dashboard"; // Redirect after signup
    }, 1000);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:grid-cols-[1fr_1.2fr] min-h-0 lg:min-h-[600px]">
        
        {/* LEFT PANEL (Curved Design) */}
        <section className="relative overflow-hidden bg-[var(--navy)] p-8 sm:p-12 text-white hidden lg:flex flex-col justify-center items-center">
          {/* Curved shape overlay */}
          <div className="absolute top-0 left-0 w-full h-[120%] bg-white opacity-5 rounded-r-[100px] transform -translate-x-1/4"></div>
          
          <div className="relative z-10 text-center">
            <img 
              src="/logo.webp" 
              alt="ComplyTrack" 
              className="h-20 w-auto object-contain mb-8 mx-auto" 
              style={{ mixBlendMode: 'screen' }} 
            />
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--teal-2)] leading-tight mb-4">
              Join ComplyTrack today.
            </h1>
            <p className="text-sm text-slate-300">
              Start managing your contractor compliance efficiently and stay ahead of expiry dates.
            </p>
          </div>
        </section>

        {/* RIGHT PANEL - Form */}
        <section className="p-6 sm:p-12 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-md">
            
            <div className="lg:hidden flex justify-center mb-8">
              <img src="/logo.webp" alt="ComplyTrack" className="h-16 w-auto object-contain" style={{ mixBlendMode: 'screen' }} />
            </div>

            <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center lg:text-left">Create an account</h2>
            <p className="mt-2 text-sm text-slate-500 text-center lg:text-left">Enter your details to get started.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              
              {/* Full Name Input */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="text" required placeholder="Thandi Nkosi" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 transition-all" />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input type="email" required placeholder="you@company.com" className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20 transition-all" />
                </div>
              </div>

              {/* Password Input */}
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

              <button 
                type="submit" 
                disabled={isLoading}
                className="group relative mt-4 flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-[var(--navy)] px-4 py-3 text-sm font-bold text-white transition-all hover:bg-[#083525] disabled:opacity-70"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></span>
                {isLoading ? "Creating account..." : "Sign up"}
                {!isLoading && <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account? <Link to="/login" className="font-bold text-[var(--navy)] hover:underline">Sign in</Link>
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}