import type { Metadata } from "next";
import { Suspense } from "react";
import { RoomScreen } from "@/components/room/room-screen";
import { normalizeCode } from "@/lib/hop/protocol";

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  return { title: `Room ${normalizeCode(code)}`, robots: { index: false } };
}

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  return (
    <Suspense>
      <RoomScreen code={normalizeCode(code)} />
    </Suspense>
  );
}
