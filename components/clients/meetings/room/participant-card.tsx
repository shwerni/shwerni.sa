// packages
import {
  HMSPeer,
  useHMSStore,
  selectAudioTrackByID,
  selectPeerAudioByID,
  selectConnectionQualityByPeerID,
} from "@100mslive/react-sdk";

// components
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/lib/utils";

// icons
import { MicOff, WifiHigh } from "lucide-react";
import React from "react";

// types
type RoleTranslations = {
  en: string;
  ar: string;
};

// role translations
const roles: Record<UserRole, RoleTranslations> = {
  [UserRole.ADMIN]: {
    en: "admin",
    ar: "admin",
  },
  [UserRole.USER]: {
    en: "user",
    ar: "عميل",
  },
  [UserRole.OWNER]: {
    en: "consultant",
    ar: "المستشار",
  },
  [UserRole.GROUP]: {
    en: "group",
    ar: "مجموعة",
  },
  [UserRole.COORDINATOR]: {
    en: "coordinator",
    ar: "منسق",
  },
  [UserRole.MANAGER]: {
    en: "manager",
    ar: "المالك",
  },
  [UserRole.MARKETER]: {
    en: "marketer",
    ar: "مسوق",
  },
  [UserRole.SERVICE]: {
    en: "service",
    ar: "خدمة",
  },
  [UserRole.COLLABORATOR]: {
    en: "collaborator",
    ar: "متاعون",
  },
  [UserRole.DESIGNER]: {
    en: "designer",
    ar: "مصمم",
  },
};

export default function ParticipantCard({
  participant,
  isEn,
}: {
  participant: HMSPeer;
  isEn?: boolean;
}) {
  // participant states
  const audioTrack = useHMSStore(
    selectAudioTrackByID(participant.audioTrack || ""),
  );
  const isMicOn = audioTrack?.enabled == true;

  // translate role
  const translateRole = (role: UserRole, isEn: boolean = false): string => {
    return roles[role]?.[isEn ? "en" : "ar"] || role;
  };

  // check if speaking
  const isSpeaking = useHMSStore(selectPeerAudioByID(participant.id)) > 5;

  // quality of network
  const connectionQuality = useHMSStore(
    selectConnectionQualityByPeerID(participant.id),
  );
  // quality score
  const signalScore = connectionQuality?.downlinkQuality;

  // metdata
  const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};

  // role
  const role = translateRole(metadata.user.role, isEn);

  // image
  const image = metadata.user.image ?? null;

  React.useEffect(() => {
    console.log(signalScore);
  }, [signalScore]);
  return (
    <Card
      className={cn([
        "relative bg-gray-100 backdrop-blur-md border border-slate-200/60 rounded-2xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        isSpeaking
          ? "border-green-500 shadow-green-500/20"
          : "border-transparent shadow-transparent",
      ])}
    >
      <CardContent className="p-4">
        <div className="flex flex-col items-center space-y-3">
          <div className="relative">
            <Avatar className="h-16 w-16">
              <AvatarImage src={image} alt={participant.name} />
              <AvatarFallback className="bg-white text-lg font-semibold">
                {participant.name[0]}
              </AvatarFallback>
            </Avatar>

            {/* speaking indicator */}
            {isSpeaking && (
              <div className="absolute -inset-1 rounded-full bg-green-500/20 animate-pulse" />
            )}

            {/* Mute indicator */}
            {!isMicOn && (
              <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}

            {/* signal indicator — top-left corner of avatar */}
            <div className="absolute -top-1 -left-1 flex items-center justify-center bg-white rounded-full px-0.5 pb-1 shadow-sm">
              <SignalIcon score={signalScore} />
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center gap-1 justify-center">
              <p className="font-medium text-sm truncate max-w-30">
                {participant.name}
              </p>
            </div>
            {participant && (
              <Badge className="bg-white text-slate-900 border-slate-300">
                {String(role).toLowerCase()}
              </Badge>
            )}

            <div className="flex items-center justify-center gap-1 h-4">
              {isSpeaking && (
                <div className="speaking-bars">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="bar" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalIcon({ score }: { score: number | undefined }) {
  const noData = score == null || score === 0;

  const color = noData
    ? "text-gray-400"
    : score <= 2
      ? "text-red-500"
      : score === 3
        ? "text-yellow-500"
        : "text-green-500";

  return <WifiHigh className={cn("h-5 w-5", color)} />;
}
