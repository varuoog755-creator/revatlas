import { Suspense } from "react";
import AuthView from "../../components/AuthView";

export const metadata = {
  title: "Create Account — RevAtlas",
  description: "Create your free RevAtlas account to access verified SaaS ARR benchmarks, executive contacts, and custom watchlists.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Loading...</div>}>
      <AuthView initialMode="signup" />
    </Suspense>
  );
}
