"use server";
// React & Next
import Image from "next/image";

// components
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Section } from "@/app/_components/layout/section";
import BackButton from "@/app/_components/layout/navigation/backButton";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import ProgramEnroll from "@/app/_components/consultants/owner/programs/enroll";

// prisma data
import {
  getConsultantProgramByCid,
  getProgramByPrid,
} from "@/data/program";
import { getOwnerbyAuthor } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";

// utils
import { cn } from "@/lib/utils";
import { findCategory } from "@/utils";

// constants
import { Categories } from "@/lib/generated/prisma/enums";

// icons
import { Award, Clock, Play, Users, Video } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ prid: string }>;
}) {
  // prid
  const { prid } = await params;

  // prid
  if (!prid) return <WrongPage />;

  // user
  const user = await userServer();

  // if user not exist
  if (!user || !user.id) return <WrongPage />;

  // get instant profile
  const owner = await getOwnerbyAuthor(user.id);

  // if user not exist
  if (!owner) return <WrongPage />;

  // program number
  const id = Number(prid);

  // program
  const program = await getProgramByPrid(id);

  // consultant of program
  const consultants = await getConsultantProgramByCid(id, owner.cid);

  // validate
  if (!program) return <WrongPage />;

  // return
  return (
    <Section>
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <BackButton
          type="link"
          link="/dashboard/programs"
          label="العودة إلى البرامج"
          className="my-5 px-1"
        />
        {/* main */}
        <div className="flex flex-col gap-5">
          <div className="relative mb-6">
            <Image
              src={program.image ?? "/other/programs.png"}
              alt={program.title}
              width={600}
              height={400}
              className="w-full h-64 md:h-80 object-cover rounded-lg"
            />
            <Badge
              className={cn([
                "absolute top-4 left-4 font-bold",
                findCategory(program?.category as Categories)?.style ??
                "bg-gray-100 text-gray-800 font-bold",
              ])}
            >
              {findCategory(program.category)?.category}
            </Badge>
          </div>
          <div className="space-y-3">
            {/* header */}
            <div>
              <h1 className="text-3xl font-bold mb-4">{program.title}</h1>
              {/* summary */}
              {/* <p className="text-lg text-muted-foreground">
                {program.summary}
                </p> */}
            </div>
            {/* info */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{program.duration} دقيقة</span>
              </div>
              <div className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                <span>{program.sessions} جلسات</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>فردي</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span>{findCategory(program.category)?.category}</span>
              </div>
            </div>
          </div>
          {/* separator */}
          <Separator />
        </div>
        {/* program */}
        <div className="container mx-auto px-4 py-8" dir="rtl">
          <div className="flex flex-col gap-8">
            {/* main Content */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-3">حول هذا البرنامج</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {program.description}
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">محاور الجلسات</h3>
                <ul className="space-y-2">
                  {program.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Play className="h-4 w-4 text-green-600" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* apply */}
      <ProgramEnroll programId={program.prid} consultantId={owner.cid} programConsultant={{ status: consultants?.status, active: true }} />
    </Section>
  );
}
