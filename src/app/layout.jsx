import "./globals.css";
import ToastContainer from "../components/Toast";
import { AuthProvider } from "../lib/auth";

export const metadata = {
  title: "RevAtlas — The Revenue Atlas of SaaS",
  description: "72,000+ SaaS companies with revenue, funding, valuation multiples & executive contacts. Free to search and export.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AuthProvider>
          {children}
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
