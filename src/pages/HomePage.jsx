import HeroSection from "../sections/HeroSection.jsx";
import ProductDemoSection from "../sections/ProductDemoSection.jsx";
import BenefitsSection from "../sections/BenefitsSection.jsx";
import ProcessSection from "../sections/ProcessSection.jsx";
import ProductsSection from "../sections/ProductsSection.jsx";
import OutcomesSection from "../sections/OutcomesSection.jsx";
import AboutSection from "../sections/AboutSection.jsx";
import ContactSection from "../sections/ContactSection.jsx";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="section-divider" aria-hidden="true" />
      <ProductDemoSection />
      <BenefitsSection />
      <ProcessSection />
      <ProductsSection />
      <OutcomesSection />
      <AboutSection />
      <div className="section-divider" aria-hidden="true" />
      <ContactSection />
    </>
  );
}
