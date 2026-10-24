import data from "../data.json";
import Directory from "../components/Directory";

export default function Page() {
  return <Directory data={data} />;
}
