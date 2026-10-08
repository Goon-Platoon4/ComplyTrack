import { ArrowRight, Building2, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";

const features = [
  "Contractor compliance tracking",
  "Document expiry monitoring",
  "Compliance reporting",
  "Audit-ready activity history",
];

export default function Login() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
          Blueprint · Authentication / Login
        </div>

        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-slate-200 bg-slate-950 p-7 text-white sm:p-10 lg:border-b-0 lg:border-r">
            <div className="mb-14 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg border border-teal-400/30 bg-teal-400/10 text-teal-300">
                <ShieldCheck size={22} />
              </div>
              <span className="text-sm font-extrabold tracking-[0.12em]">COMPLYTRACK</span>
            </div>

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">Login experience</span>
            <h1 className="mt-3 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Secure access to the contractor compliance workspace.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300">
              This area introduces the product and explains what an authenticated user can access.
            </p>

            <div className="mt-8 space-y-3">
              {features.map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                  <CheckCircle2 size={17} className="shrink-0 text-teal-300" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-14 border-t border-white/10 pt-5 text-xs text-slate-400">
              Built for South African organisations
            </div>
          </section>

          <section className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="mb-7 grid h-11 w-11 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-700">
                <LockKeyhole size={21} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-700">Authentication form</span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Sign in</h2>
              <p className="mt-2 text-sm text-slate-500">User authentication form goes here.</p>

              <div className="mt-7 space-y-5">
                <BlueprintInput icon={Mail} label="Email address" placeholder="User enters email" />
                <BlueprintInput icon={LockKeyhole} label="Password" placeholder="User enters password" />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>□ Remember me</span>
                <span className="font-semibold text-teal-700">Forgot password?</span>
              </div>

              <button type="button" className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800">
                Sign in <ArrowRight size={17} />
              </button>

              <div className="mt-6 flex gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                <ShieldCheck size={19} className="mt-0.5 shrink-0 text-teal-700" />
                <div>
                  <strong className="block text-sm">Secure authentication</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    Authentication will eventually use the backend authentication API and secure sessions or tokens.
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-3 rounded-xl border border-slate-200 p-4">
                <Building2 size={19} className="mt-0.5 shrink-0 text-slate-500" />
                <div>
                  <strong className="block text-sm">Organisation workspace</strong>
                  <span className="mt-1 block text-xs leading-5 text-slate-500">
                    The authenticated user&apos;s organisation will be loaded after successful login.
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <BlueprintNotes items={[
          "Login should call the backend authentication endpoint.",
          "Do not hard-code passwords or users in the frontend.",
          "Authentication state should be stored through the application auth context.",
          "Protected routes should redirect unauthenticated users to Login.",
          "Forgot password can be implemented as a separate feature later.",
        ]} />
      </div>
    </main>
  );
}

function BlueprintInput({ icon: Icon, label, placeholder }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-700">
        <Icon size={15} /> {label}
      </div>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-400">
        {placeholder}
      </div>
    </div>
  );
}

function BlueprintNotes({ items }) {
  return (
    <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
      <strong className="text-sm">Development notes</strong>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-5 text-slate-600">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  );
}
