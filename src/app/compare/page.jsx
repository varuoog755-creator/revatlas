import data from "../../data.json";
import CompareTool from "../../components/CompareTool";

export const metadata = {
  title: "Compare SaaS Companies Side-by-Side — RevAtlas",
  description: "Benchmark ARR, valuation multiples, team productivity, and growth rates between leading SaaS companies.",
};

export default function ComparePage() {
  return <CompareTool data={data} />;
}
