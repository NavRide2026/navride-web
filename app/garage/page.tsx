import type { Metadata } from "next";
import DesignStudioClient from "@/components/design/DesignStudioClient";

export const metadata: Metadata = {
  title: "Diseño y personalización | NavRide",
  description:
    "Busca iconos en fuentes oficiales, organiza tu biblioteca en carpetas propias y sincroniza temas Web↔App.",
};

export default function DisenoPage() {
  return <DesignStudioClient />;
}
