import { ProtoLoader } from "@/components/proto/ProtoLoader";

/**
 * PROTOTYPE ROUTE.
 *
 * The design work (the cinematic journey, the overlay, the document
 * fallback) is untouched under components/journey and components/
 * sections — it is simply not mounted here. This page exists to prove
 * one thing: scrolling moves a real 3D camera through real distance.
 */
export default function HomePage() {
  return <ProtoLoader />;
}
