// components
import Hero from "@/components/clients/home/hero";
import Join from "@/components/clients/home/join";
import Steps from "@/components/clients/home/steps";
import Services from "@/components/clients/home/services";
import Benefits from "@/components/clients/home/benefits";
import Categories from "@/components/clients/home/categories";
import Reviews from "@/components/clients/home/reviews/reviews";
import InstantList from "@/components/clients/home/instant/instant-list";
import Statistics from "@/components/clients/home/statistics/statistics";
import Consultants from "@/components/clients/home/consultant/consultants";
import { OrderNotification } from "./notification/notification-lazy";
import Podcast from "./youtube/youtube";

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
      <Steps />
      {/* youtube */}
      <Podcast />
      {/* benefits */}
      <Benefits />
      {/* join us */}
      <Join />
    </>
  );
};

export default Home;
