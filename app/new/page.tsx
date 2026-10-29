import type { Metadata } from "next";
import { NewRoom } from "@/components/room/new-room";

export const metadata: Metadata = { title: "Opening a room" };

export default function NewRoomPage() {
  return <NewRoom />;
}
