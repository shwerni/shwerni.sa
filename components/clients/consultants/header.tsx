// React & Image
import Image from "next/image";

const ConsultantsHeader = () => {
  return (
    <div
      className="flex items-center justify-between px-6 lg:px-24 py-14 lg:py-0 mx-auto my-0! rounded overflow-hidden"
      style={{
        background:
          "linear-gradient(270deg, rgba(17, 126, 216, 0.5) 0%, rgba(31, 42, 55, 0) 100%), rgba(57, 120, 171, 0.3)",
      }}
    >
      {/* content */}
      <div className="flex flex-col items-center gap-5 lg:gap-8 text-center lg:text-right mx-auto">
        <h3 className="max-w-72 lg:max-w-3xl text-[#1F2A37] text-2xl lg:leading-16 lg:text-5xl font-semibold">
          نخبة من المستشارين المؤهلين لخدمتك باحترافية
        </h3>
        <p className="max-w-md lg:max-w-3xl text-white text-sm lg:leading-10 lg:text-lg font-medium">
          فريق من المستشارين المتخصصين الذين يفهمون احتياجاتك بعمق، ويقدمون لك
          الدعم النفسي، الأسري، والمهني باحترافية عالية، مع ضمان سرية تامة
          واهتمام شخصي بكل تفاصيل استشارتك
        </p>
      </div>
      {/* images style */}
      <Image
        src="/layout/consultant-menu1.png"
        alt="icon"
        width={375}
        height={375}
        className="hidden lg:block"
      />
    </div>
  );
};

export default ConsultantsHeader;
