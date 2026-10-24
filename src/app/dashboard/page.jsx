import data from "../../data.json";
import CustomerDashboard from "../../components/CustomerDashboard";

export const metadata = {
  title: "Customer Dashboard — RevAtlas",
  description: "Manage your saved SaaS leads, export quotas, and API access.",
};

export default function DashboardPage() {
  return <CustomerDashboard initialData={data} />;
}
