import { Suspense } from "react";
import SokoApp from "@/components/SokoApp";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <SokoApp />
    </Suspense>
  );
}
