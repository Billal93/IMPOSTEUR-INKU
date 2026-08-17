import { notFound } from "next/navigation";
import { RoomClient } from "@/components/room/RoomClient";
import { isValidRoomCode } from "@/lib/text";

export const dynamic = "force-dynamic";

export default async function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const upper = code.toUpperCase();
  if (!isValidRoomCode(upper)) notFound();

  return <RoomClient code={upper} />;
}
