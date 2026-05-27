import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import Services from '../components/Services.jsx';
import Benefits from '../components/Benefits.jsx';
import OnlineSchedule from '../components/OnlineSchedule.jsx';
import Team from '../components/Team.jsx';
import Testimonials from '../components/Testimonials.jsx';
import FAQ from '../components/FAQ.jsx';
import FinalCTA from '../components/FinalCTA.jsx';
import Footer from '../components/Footer.jsx';

export default function ClientLanding() {
  return (
    <div className="overflow-hidden bg-[#f8fbff]">
      <Header />
      <main>
        <Hero />
        <Services />
        <Benefits />
        <OnlineSchedule />
        <Team />
        <Testimonials />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
