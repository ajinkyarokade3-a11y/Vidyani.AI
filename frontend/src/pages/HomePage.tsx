import { Benefits } from "@/components/landing/Benefits";
import { CTASection } from "@/components/landing/CTASection";
import { FAQ } from "@/components/landing/FAQ";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { Footer } from "@/components/landing/Footer";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Navbar } from "@/components/landing/Navbar";

export function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <Hero />
        <FeatureGrid />
        <HowItWorks />
        <Benefits />
        <FAQ />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
