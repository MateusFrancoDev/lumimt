"use client";

import dynamic from "next/dynamic";

/**
 * `ssr: false` is only allowed inside a Client Component (see the
 * lazy-loading guide in this version of Next), so the dynamic import
 * lives here and the page stays a Server Component.
 */
const SpaceProto = dynamic(
  () => import("@/components/proto/SpaceProto").then((m) => m.SpaceProto),
  {
    ssr: false,
    loading: () => <div className="proto__booting mono">Loading scene…</div>,
  },
);

export function ProtoLoader() {
  return <SpaceProto />;
}
