// React & Next
import { useTheme } from "next-themes";

// components
import PhoneInput from "react-phone-input-2";

// css
import "react-phone-input-2/lib/style.css";

// constants
import arPhone from "@/constants/phone/countries-phone.json";

// props
interface Props {
  value: string;
  onChange: (value: string) => void;
  dir?: "rtl" | "ltr";
  disabled?: boolean;
  backGroundColor?: string;
  maxWidth?: string;
  minWidth?: string;
}
export default function ZPhoneInput({
  value,
  onChange,
  dir,
  maxWidth,
  minWidth,
  backGroundColor,
  disabled,
}: Props) {
  // theme
  const { resolvedTheme } = useTheme();

  // background
  const background =
    resolvedTheme === "dark" ? "rgb(6, 21, 45)" : "rgb(245 248 255)";

  return (
    <div dir={dir ?? "ltr"}>
      {/* input */}
      <PhoneInput
        onlyCountries={[
          "sa",
          "eg",
          "ps",
          "qa",
          "om",
          "ae",
          "kw",
          "jo",
          "lb",
          "iq",
          "bh",
          "sy",
          "ye",
        ]}
        country={"sa"}
        localization={arPhone}
        value={value}
        onChange={onChange}
        inputClass="phoneInput"
        inputStyle={{
          width: "100%",
          minWidth: minWidth ?? "15rem",
          maxWidth: maxWidth ?? "20rem",
          backgroundColor: backGroundColor ?? background,
        }}
        dropdownStyle={{
          backgroundColor: backGroundColor ?? background,
        }}
        buttonStyle={{ backgroundColor: backGroundColor ?? "#e2e8f0" }}
        disabled={disabled}
      />
    </div>
  );
}
