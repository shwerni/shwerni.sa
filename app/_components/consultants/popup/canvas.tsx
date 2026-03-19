"use client";
// React & Next
import React from "react";
// components
import { Button } from "@/components/ui/button";
import { DialogClose, DialogFooter } from "@/components/ui/dialog";
// prisma types
import { Gender } from "@/lib/generated/prisma/enums";

// image sources to switch between
const IMAGES = [
  {
    src: "/other/ramadan-1447-1.png",
    color: "black",
    x: (w: number) => w /1.4,
    y: (h: number) => h - 75,
  },
  {
    src: "/other/ramadan-1447-2.png",
    color: "white",
    x: (w: number) => w / 2,
    y: (h: number) => h - 100,
  },
];

// props
interface Props {
  name: string;
  gender: Gender;
}

const CanvasCenter: React.FC<Props> = ({ name, gender }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [srcIndex, setSrcIndex] = React.useState(0);

  const drawCanvas = React.useCallback(
    (index: number) => {
      const { src, color, x, y } = IMAGES[index];
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        ctx.font = "bold 50px 'Baloo Bhaijaan 2', 'Poppins'";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.fillStyle = color;
        ctx.textAlign = "center";

        const txt =
          (gender === Gender.MALE ? "المستشار/ " : "المستشارة/ ") + name;

        ctx.strokeText(txt, x(canvas.width), y(canvas.height));
        ctx.fillText(txt, x(canvas.width), y(canvas.height));
      };
      img.src = src;
    },
    [name, gender],
  );

  // update useEffect and handleSwitch to pass index instead of src
  React.useEffect(() => {
    drawCanvas(srcIndex);
  }, [srcIndex, drawCanvas]);

  // download current canvas
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `ramadan-kareem-${srcIndex + 1}.png`;
    link.click();
  };

  // switch to next image
  const handleSwitch = () => {
    setSrcIndex((prev) => (prev + 1) % IMAGES.length);
  };

  return (
    <>
      <div
        style={{ backgroundImage: "url('/keychainBG.png')" }}
        className="flex justify-center items-center"
      >
        <canvas ref={canvasRef} className="w-full rounded-lg" />
      </div>

      <DialogFooter>
        <div className="flex justify-center gap-3 sm:gap-5 max-w-80 mx-auto flex-wrap">
          {/* switch image */}
          <Button onClick={handleSwitch} className="w-32" variant="outline">
            {srcIndex === 0 ? "التصميم الثاني" : "التصميم الأول"}
          </Button>

          {/* download */}
          <Button onClick={handleDownload} className="w-32" variant="primary">
            تحميل
          </Button>

          {/* close */}
          <DialogClose asChild>
            <Button className="zgreyBtn w-32">غلق</Button>
          </DialogClose>
        </div>
      </DialogFooter>
    </>
  );
};

export default CanvasCenter;
