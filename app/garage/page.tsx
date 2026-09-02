import type { Metadata } from "next";
import GarageClient from "./GarageClient";

export const metadata: Metadata = {
  title: "NavRide Garage",
  description: "Haz que NavRide sea tuyo. Personaliza puck, HUD, ruta y más.",
};

export default function GaragePage() {
  return <GarageClient />;
}
