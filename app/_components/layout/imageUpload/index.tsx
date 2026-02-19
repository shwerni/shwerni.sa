"use client";
// React & Next
import React from "react";
import Image from "next/image";

// lib
import { UploadButton } from "@/lib/upload";

// component
import { ZToast } from "@/app/_components/layout/toasts";

export default function ImageUplaod() {
  // test
  const [image, setImage] = React.useState("");
  return (
    <div>
      here
      <br />
      <br />
      <UploadButton
        className="upload-thing"
        endpoint="imageUploader"
        onClientUploadComplete={(res) => {
          // Do something with the response
          console.log("Files: ", res);
          setImage(res[0].url);
          ZToast({ state: true, message: "تم تحميل الملف" });
        }}
        onUploadError={(error: Error) => {
          console.log(error);
          ZToast({ state: false, message: "حدث خطأ اثناء تحميل الملف" });
        }}
      />
      {String(image).length !== 0 && (
        <div>
          <Image src={image} alt="image" width={100} height={100} />
        </div>
      )}
    </div>
  );
}
