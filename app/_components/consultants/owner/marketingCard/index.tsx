"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogFooter } from "@/app/_components/layout/zDialog";
import { Gender } from "@/lib/generated/prisma/enums";
import QRCode from "qrcode";
import { aiConsultantSummary } from "@/lib/api/ai/ai";

interface Props {
  cid: number;
  name: string;
  image?: string;
  about: string;
  gender: Gender;
  experience: string[];
  education: string[];
}

export default function ConsultantInfoCard({
  cid,
  name,
  image,
  about,
  gender,
  education,
  experience,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);

  const generateImage = React.useCallback(async () => {
    setIsLoading(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // background + profile images
    const bg = new Image();
    const profile = new Image();
    bg.crossOrigin = "anonymous";
    profile.crossOrigin = "anonymous";
    bg.src = "/other/card.png";
    profile.src =
      image ||
      (gender === Gender.MALE
        ? "/other/male-card.png"
        : "/other/female-card.png");

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        bg.onload = () => resolve();
        bg.onerror = () => reject("bg failed");
      }),
      new Promise<void>((resolve, reject) => {
        profile.onload = () => resolve();
        profile.onerror = () => reject("profile failed");
      }),
    ]);

    canvas.width = bg.naturalWidth;
    canvas.height = bg.naturalHeight;
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    // profile photo
    const imgSize = 325;
    const imgY = 200;
    const imgX = canvas.width / 2 - imgSize / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, imgY + imgSize / 2, imgSize / 2, 0, Math.PI * 2);

    // if image exist make sure its has background color
    if (image) {
      ctx.fillStyle = "#F7F7F7";
      ctx.fill();
    }

    ctx.clip();
    ctx.drawImage(profile, imgX, imgY, imgSize, imgSize);
    ctx.restore();

    // name
    ctx.font = "bold 40px 'Noto Kufi Arabic'";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(
      (gender === Gender.MALE ? "المستشار" : "المستشارة") + " / " + name,
      canvas.width / 2,
      620
    );

    // text area setup
    ctx.font = "800 35px 'Noto Kufi Arabic'";
    ctx.fillStyle = "#076BC3";
    ctx.textAlign = "right";

    const baseY = 750;
    const lineHeight = 45;
    const maxWidth = canvas.width * 0.7;

    // load SVG bullet icon
    const bulletIcon = new Image();
    bulletIcon.src = "/svg/arrow-left1.svg";
    await new Promise<void>((resolve) => (bulletIcon.onload = () => resolve()));

    const iconSize = 75;
    const textX = 900;
    const iconX = textX - 5;

    // get AI summary
    const info = await aiConsultantSummary(
      about,
      experience,
      education,
      gender
    );

    // helper to wrap text
    const wrapText = (text: string, y: number, drawIcon: boolean) => {
      const words = text.split(" ");
      let line = "";
      const lines: string[] = [];

      for (const word of words) {
        const testLine = line + word + " ";
        const testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && line !== "") {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line.trim());

      if (drawIcon) {
        const iconY = y - iconSize + 20;
        ctx.drawImage(bulletIcon, iconX, iconY, iconSize, iconSize);
      }

      lines.forEach((l, i) => ctx.fillText(l, textX, y + i * lineHeight));

      return lines.length;
    };

    // print lines
    let offset = 0;
    info.forEach((line) => {
      const usedLines = wrapText(line, baseY + offset * lineHeight, true);
      offset += usedLines + 1;
    });

    // QR code
    const qrURL = "https://shwerni.sa/consultant/" + cid;
    const qrDataUrl = await QRCode.toDataURL(qrURL, {
      width: 150,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff00" },
    });

    const qrImg = new Image();
    qrImg.src = qrDataUrl;
    await new Promise<void>((resolve) => (qrImg.onload = () => resolve()));

    const qrSize = 115;
    const qrX = 45;
    const qrY = 50;
    const radius = 20;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(qrX + radius, qrY);
    ctx.lineTo(qrX + qrSize - radius, qrY);
    ctx.quadraticCurveTo(qrX + qrSize, qrY, qrX + qrSize, qrY + radius);
    ctx.lineTo(qrX + qrSize, qrY + qrSize - radius);
    ctx.quadraticCurveTo(
      qrX + qrSize,
      qrY + qrSize,
      qrX + qrSize - radius,
      qrY + qrSize
    );
    ctx.lineTo(qrX + radius, qrY + qrSize);
    ctx.quadraticCurveTo(qrX, qrY + qrSize, qrX, qrY + qrSize - radius);
    ctx.lineTo(qrX, qrY + radius);
    ctx.quadraticCurveTo(qrX, qrY, qrX + radius, qrY);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    ctx.restore();

    setIsLoading(false);
  }, [cid, name, image, about, gender, education, experience]);

  // generate image every time dialog opens
  React.useEffect(() => {
    if (isDialogOpen) {
      const timer = setTimeout(() => generateImage(), 200);
      return () => clearTimeout(timer);
    }
  }, [isDialogOpen, generateImage]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.href = canvasRef.current.toDataURL("image/png");
    link.download = "consultant_card.png";
    link.click();
  };

  return (
    <Dialog onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="zgreyBtn m-3">عرض بطاقة المستشار</Button>
      </DialogTrigger>

      <DialogContent className="w-11/12 max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>بطاقة المستشار</DialogTitle>
        </DialogHeader>

        <div className="cflex gap-5 relative min-h-[300px]">
          {/* Canvas */}
          <canvas
            ref={canvasRef}
            className={`w-full rounded-lg bg-gray-100 border border-gray-300 transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-lg">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-400 border-t-transparent mb-4" />
              <p className="text-gray-700 font-medium">
                جاري إنشاء بطاقة المستشار...
              </p>
            </div>
          )}

          <DialogFooter className="w-full">
            <div className="flex justify-center gap-5 sm:gap-10 max-w-80 mx-auto">
              <DialogClose asChild disabled={isLoading}>
                <Button
                  onClick={handleDownload}
                  className="zgreyBtn w-32"
                  disabled={isLoading}
                >
                  تحميل الصورة
                </Button>
              </DialogClose>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
