import type { Metadata } from "next";
import { ResearchWorkbench } from "./research-workbench";

export const metadata: Metadata = {
  title: { absolute: "The Inhabited Archive" },
  description:
    "Translate a historical research question across languages, then inspect the cited sources worth reading.",
};

export default function Home() {
  return <ResearchWorkbench />;
}
