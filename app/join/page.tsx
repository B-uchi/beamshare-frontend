import type { Metadata } from "next";
import { Suspense } from "react";
import { JoinForm } from "@/components/room/join-form";
import { Logo } from "@/components/site/logo";
import Link from "next/link";

export const metadata: Metadata = { title: "Join a room" };

export default function JoinPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-ground">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <Link href="/new" className="btn btn-ghost btn-sm">Start a room instead</Link>
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pb-24 pt-8 sm:items-center sm:pt-0">
        <Suspense>
          <JoinForm />
        </Suspense>
      </div>
    </main>
  );
}
