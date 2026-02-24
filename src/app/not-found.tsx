import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="pt-[60px] min-h-[70vh] flex items-center justify-center">
        <div className="text-center px-4">
          <h1
            className="text-[clamp(64px,15vw,160px)] leading-[.9] text-[#111]"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            404<span className="text-brand">.</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#999] mt-4 mb-8">
            Page not found
          </p>
          <Link
            href="/"
            className="text-[10px] font-bold uppercase tracking-[.15em] bg-[#111] text-white px-6 py-3 rounded hover:bg-brand transition-colors no-underline"
          >
            Back to Portfolio
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
