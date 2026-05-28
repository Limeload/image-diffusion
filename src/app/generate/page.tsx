import Link from "next/link";
import GenerateForm from "@/components/GenerateForm";

export default function GeneratePage() {
  return (
    <div className="min-h-screen flex flex-col p-8">
      <header className="flex items-center justify-between mb-10">
        <Link href="/feed" className="text-2xl font-bold">
          Pentagram
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/feed" className="hover:underline">Feed</Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-xl font-semibold mb-8">Generate an image</h1>
        <GenerateForm />
      </main>
    </div>
  );
}
