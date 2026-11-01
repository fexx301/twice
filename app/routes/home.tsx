import { redirect } from "react-router";
export function loader() {
  return redirect("/batches");
}
export default function Home() {
  return null;
}
