import Image from "next/image";

const ProgramsHeader = () => {
  return (
    <div className="relative flex flex-col items-center gap-5 text-center bg-linear-to-b from-[#34068312] to-[#7E91FF47] mx-auto py-14">
      {/* content */}
      <h3 className="text-[#094577] text-3xl lg:text-4xl font-semibold">
        برامجنا المميزة
      </h3>
      <p className="max-w-md text-gray-800 text-base font-medium leading-8">
        اكتشف باقة من البرامج المتخصصة التي صُممت بعناية لمساعدتك على تطوير
        مهاراتك، تحقيق أهدافك، وتحسين جودة حياتك الشخصية والمهنية.
      </p>

      {/* images style */}
      <Image
        src="/svg/home/home-stars.svg"
        alt="icon"
        width={300}
        height={300}
        className="absolute top-2 right-0"
      />
    </div>
  );
};

export default ProgramsHeader;
