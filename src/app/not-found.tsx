import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-paper px-4">
      <div className="text-center">
        <Logo />
        <h1 className="display mt-8 text-[56px]">Not found</h1>
        <p className="mt-2 text-[15px] text-muted">This page doesn&apos;t exist, or you don&apos;t have access to it.</p>
        <div className="mt-6 flex justify-center gap-4 text-[14px]">
          <Link href="/" className="underline underline-offset-4">Home</Link>
          <Link href="/app" className="underline underline-offset-4">Workspace</Link>
        </div>
      </div>
    </div>
  );
}
