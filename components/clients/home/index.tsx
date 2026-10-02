// React & Next
import { Suspense } from "react";

// components
import Hero from "@/components/clients/home/hero";
import Join from "@/components/clients/home/join";
import Steps from "@/components/clients/home/steps";
import Services from "@/components/clients/home/services";
import Benefits from "@/components/clients/home/benefits";
import Reviews from "@/components/clients/home/reviews/reviews";
import InstantList from "@/components/clients/home/instant/instant-list";
import Statistics from "@/components/clients/home/statistics/statistics";
import Consultants from "@/components/clients/home/consultant/consultants";
import { OrderNotification } from "./notification/notification-lazy";
import Podcast from "./youtube/youtube";
// import Coupons from "@/components/clients/home/coupons/coupons";
import HomeCards from "@/components/clients/home/home-cards";
import Categories from "./categories";

const Home = async () => {
  return (
    <>
      {/* order notification */}
      <OrderNotification />
      {/* hero */}
      <Hero />
      {/* categories */}
      <Categories />
      {/* instant list */}
      <InstantList />
      {/* home cards */}
      <HomeCards />
      {/* consultant */}
      <Consultants />
      {/* services */}
      <Services />
      {/* marriage awareness */}
      {/* <MarriageAwareness /> */}
      {/* programs */}
      {/* <Programs /> */}
      {/* coupons */}
      {/* <Coupons /> */}
      {/* statistics */}
      <Statistics />
      {/* reviews */}
      <Reviews />
      {/* steps to use */}
      {/* <Steps /> */}
      {/* benefits */}
      <Benefits />
      {/* youtube */}
      <Podcast />
      {/* join us: shown to logged-out visitors only, so it reads the session in its own
          suspense boundary and stays out of the prerendered shell */}
      <Suspense fallback={null}>
        <Join />
      </Suspense>
    </>
  );
};

export default Home;
