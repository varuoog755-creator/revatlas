import data from "../../data.json";
import ValuationCalculator from "../../components/ValuationCalculator";

export const metadata = {
  title: "SaaS Valuation & Revenue Multiple Calculator — RevAtlas",
  description: "Calculate your SaaS company valuation and market revenue multiples based on real ARR benchmarks and Rule of 40 metrics.",
};

export default function CalculatorPage() {
  return <ValuationCalculator data={data} />;
}
