import { LoginForm } from "./login-form";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign in | Texril",
};

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/app/admin/tenants");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        <div className="space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to Texril</h1>
          <p className="text-sm text-muted-foreground">
            Use the super admin credentials from the seed script or your tenant admin login.
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
