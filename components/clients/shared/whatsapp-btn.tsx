// React & Next
import Image from "next/image";

// package
import * as motion from "motion/react-client";

const WhatsappBtn = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 80 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="fixed bottom-2 right-0 sm:bottom-3 sm:right-3 flex items-center justify-center w-24 z-50"
    >
      <span className="absolute h-12 w-12 animate-ping rounded-full bg-green-200 duration-[3000] -z-1"></span>
      <a
        href="https://wa.me/966554117879"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div className="flex justify-center items-center w-14 h-14 rounded-full bg-green-500">
          <Image
            src="/svg/whatsapp-btn.svg"
            alt="WhatsApp"
            width={30}
            height={30}
            priority={false}
          />
        </div>
      </a>
    </motion.div>
  );
};

export default WhatsappBtn;
