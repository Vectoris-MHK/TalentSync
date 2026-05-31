import { useContext, useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import AppDownload from "../components/AppDownload";
import Footer from "../components/Footer";
import Calltoaction from "../components/Calltoaction";
import RecommendedJobs from "../components/RecommendedJobs";
import OnboardingModal from "../components/OnboardingModal";
import { AppContext } from "../context/AppContext";

const Home = () => {
  const { userData, setUserData, companyToken, backendUrl } = useContext(AppContext);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding modal when user is logged in and has no preferences yet
  useEffect(() => {
    if (userData && !companyToken && userData.preferences?.length === 0) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setShowOnboarding(true), 800);
      return () => clearTimeout(timer);
    }
  }, [userData, companyToken]);

  const handleOnboardingClose = (savedPreferences) => {
    setShowOnboarding(false);
    // Optimistically update userData so RecommendedJobs re-renders with preferences
    if (savedPreferences.length > 0 && userData) {
      setUserData((prev) => ({ ...prev, preferences: savedPreferences }));
    }
  };

  return (
    <div>
      <Navbar />
      <Hero />

      {/* Personalized recommendations — only for authenticated non-recruiter users */}
      {userData && !companyToken && (
        <RecommendedJobs />
      )}

      <JobListing />
      <AppDownload />
      <Calltoaction />
      <Footer />

      {showOnboarding && (
        <OnboardingModal
          backendUrl={backendUrl}
          onClose={handleOnboardingClose}
        />
      )}
    </div>
  );
};

export default Home;
