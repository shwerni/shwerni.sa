"use client";
// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";

// prisma types
import { Gender } from "@/lib/generated/prisma/enums";

// props
interface Props {
  name: string;
  gender: Gender;
}

const CanvasCenter: React.FC<Props> = ({ name, gender }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const img = new Image();

    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas size to match the image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

      ctx.font = "bold 50px 'Baloo Bhaijaan 2', 'Poppins'";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.fillStyle = "white";
      ctx.textAlign = "center";

      const txt =
        (gender === Gender.MALE ? "المستشار/ " : "المستشارة/ ") + name;

      // Center horizontally
      const x = canvas.width / 2;

      // Position near bottom with padding
      const bottomPadding = 80; // adjust as needed
      const y = canvas.height - bottomPadding;

      ctx.strokeText(txt, x, y);
      ctx.fillText(txt, x, y);
    };

    img.src = "/other/ramadan2026.jpg";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Function to trigger canvas download
  const handleDownload = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "ramadan kareem.png";
    link.click();
  };

  return (
    <>
      <div
        style={{
          backgroundImage: "url('/keychainBG.png')",
        }}
        className="flex justify-center items-center"
      >
        <canvas ref={canvasRef} className="w-full rounded-lg" />
      </div>

      <DialogFooter>
        <div className="flex justify-center gap-5 sm:gap-10 max-w-80 mx-auto">
          <Button onClick={handleDownload} className="w-32" variant="primary">
            تحميل
          </Button>
          <DialogClose asChild>
            <Button className="zgreyBtn w-32">غلق</Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </>
  );
};

export default CanvasCenter;
