import { Suspense } from "react";
import AuthView from "../../components/AuthView";

export const metadata = {
  title: "Sign In — RevAtlas",
  description: "Sign in to your RevAtlas account to access 72,000+ verified SaaS financials, lead cards, and valuation metrics.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: "80px 0", textAlign: "center" }}>Loading...</div>}>
      <AuthView initialMode="signin" />
    </Suspense>
  );
}
