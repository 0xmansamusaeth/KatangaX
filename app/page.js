import { redirect } from "next/navigation";

export default function Home() {
  // Dashboard handles both guest and authenticated states.
  redirect("/dashboard");
}
