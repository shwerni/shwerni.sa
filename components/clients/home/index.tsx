// components
import Hero from "@/components/clients/home/hero";
import Join from "@/components/clients/home/join";
import Steps from "@/components/clients/home/steps";
import Sticky from "@//components/clients/home/sticky";
import Benefits from "@/components/clients/home/benefits";
import Categories from "@/components/clients/home/categories";
import Reviews from "@/components/clients/home/reviews/reviews";
import Coupons from "@/components/clients/home/coupons/coupons";
import Programs from "@/components/clients/home/programs/programs";
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
      {/* steps to use */}
      <Steps />
      {/* consultant */}
      <Consultants />
      {/* programs */}
      <Programs />
      {/* statistics */}
      <Statistics />
      {/* coupons */}
      <Coupons />
      {/* reviews */}
      <Reviews />
      {/* benefits */}
      <Benefits />
      {/* join us */}
      <Join />
    </>
  );
};

export default Home;
