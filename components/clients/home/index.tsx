// components
import Hero from "@/components/clients/home/hero";
import Join from "@/components/clients/home/join";
import Steps from "@/components/clients/home/steps";
import Sticky from "@/components/clients/home/instant";
import Services from "@/components/clients/home/services";
import Benefits from "@/components/clients/home/benefits";
import Categories from "@/components/clients/home/categories";
import Reviews from "@/components/clients/home/reviews/reviews";
import Statistics from "@/components/clients/home/statistics/statistics";
import Consultants from "@/components/clients/home/consultant/consultants";

const Home = async () => {
  return (
    <>
      {/* instant sticky */}
      <Sticky />
      {/* hero */}
      <Hero />
      {/* categories */}
      <Categories />
      {/* consultant */}
      <Consultants />
      {/* services */}
      <Services />
      {/* marriage awareness */}
      {/* <MarriageAwareness /> */}
      {/* programs */}
      {/* <Programs /> */}
      {/* steps to use */}
      <Steps />
      {/* coupons */}
      {/* <Coupons /> */}
      {/* reviews */}
      <Reviews />
      {/* statistics */}
      <Statistics />
      {/* benefits */}
      <Benefits />
      {/* join us */}
      <Join />
    </>
  );
};

export default Home;
