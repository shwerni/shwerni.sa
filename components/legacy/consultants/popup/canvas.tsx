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
    src: "/other/eid1.png",
    color: "white",
    x: (w: number) => w / 2,
    y: (h: number) => h - 75,
  },
  {
    src: "/other/eid2.png",
    color: "white",
    x: (w: number) => w / 2,
    y: (h: number) => h - 400,
  },
  {
    src: "/other/eid3.png",
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

        ctx.font = "bold 75px 'Amiri', serif";
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.fillStyle = color;
        ctx.textAlign = "center";

        const line1 =
          (gender === Gender.MALE ? "المستشار / " : "المستشارة / ") + name;
        const line2 = "";

        const baseX = x(canvas.width);
        const baseY = y(canvas.height);

        // spacing between lines
        const lineHeight = 60;

        // first line
        ctx.strokeText(line1, baseX, baseY);
        ctx.fillText(line1, baseX, baseY);

        // second line (under it)
        ctx.strokeText(line2, baseX, baseY + lineHeight);
        ctx.fillText(line2, baseX, baseY + lineHeight);
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
    link.download = `eid-${srcIndex + 1}.png`;
    link.click();
  };

  // switch to next image
  const handleSwitch = (index: number) => {
    setSrcIndex(index);
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
        <div className="flex flex-col items-center justify-center gap-3">
          {/* switch image */}
          <div className="grid grid-cols-3 gap-5">
            {IMAGES.map((i, index) => (
              <Button
                onClick={() => handleSwitch(index)}
                variant="secondary"
                key={index}
              >
                {index === 0 && "التصميم الأول"}
                {index === 1 && "التصميم الثاني"}
                {index === 2 && "التصميم الثالث"}
              </Button>
            ))}
          </div>

          {/* download */}
          <div className="flex items-center gap-5">
            <Button onClick={handleDownload} className="w-32" variant="primary">
              تحميل
            </Button>

            {/* close */}
            <DialogClose asChild>
              <Button className="zgreyBtn w-32">غلق</Button>
            </DialogClose>
          </div>
        </div>
      </DialogFooter>
    </>
  );
};

export default CanvasCenter;
