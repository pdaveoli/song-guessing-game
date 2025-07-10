import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6 md:p-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="w-full max-w-lg">
        <LoginForm />
      </div>
    </div>
  );
}
