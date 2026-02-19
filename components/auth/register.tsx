// React & Next
import Link from "next/link";
import Image from "next/image";

// components
import Logo from "@/components/shared/logo";
import RegisterForm from "@/components/auth/resgister-form";

const Register = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2">
      {/* right side */}
      <div className="flex flex-col items-center justify-center min-h-screen space-y-10 md:space-y-14">
        {/* logo */}
        <Logo width={200} height={200} className="md:hidden" />
        <h2 className="text-[#094577] text-3xl md:text-4xl font-semibold">
          إنشاء حساب
        </h2>
        {/* logIn form */}
        <div className="space-y-3">
          <RegisterForm />
          <div className="flex items-center justify-center gap-2">
            <h5 className="text-sm text-gray-500">لديك حساب ؟</h5>
            <Link
              className="text-sm text-[#117ED8] font-medium underline"
              href="/login"
            >
              تسجل الدخول
            </Link>
          </div>
        </div>
      </div>
      {/* left side */}
      <div className="hidden relative min-h-screen md:flex items-end">
        {/* overlay */}
        <Image
          src="/layout/auth/login.png"
          alt="login"
          fill
          priority
          className="object-cover"
        />
        {/* data */}
        <div className="w-11/12 space-y-6 px-10 py-14 mx-auto z-2">
          <Logo variant="white" width={150} height={150} />
          <div className="space-y-4">
            <h3 className="text-white text-3xl font-semibold">
              معًا نبني جسور الراحة النفسية
            </h3>
            <p className="text-white text-sm">
              سجّل دخولك لتكون جزءًا من هذه الرحلة: كمستشار تمنح خبرتك وتساند
              الآخرين، أو كمستفيد تبحث عن الراحة النفسية والدعم بكل خصوصية
              وأمان.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
