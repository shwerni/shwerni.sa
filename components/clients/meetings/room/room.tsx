"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// packages
import {
  HMSPeer,
  useHMSStore,
  selectAudioTrackByID,
  selectPeerAudioByID,
  selectIsLocalAudioEnabled,
  useHMSActions,
  useDevices,
  DeviceType,
  useHMSNotifications,
  HMSNotificationTypes,
} from "@100mslive/react-sdk";

// components
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RoomDuration from "./duration";
import RoomEndingCountdown from "./countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import SkeletonAudioRoom from "@/components/clients/meetings/room/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/lib/utils";
import { isEnglish, playRoomSound } from "@/utils";

// types
import { Lang } from "@/types/types";

// icons
import {
  MicOff,
  Phone,
  Volume2,
  VolumeX,
  Users,
  Mic,
  Check,
} from "lucide-react";

// props
interface Props {
  lang: Lang;
  isConnected: boolean;
  duration: number;
  participants: HMSPeer[];
}

type RoleTranslations = {
  en: string;
  ar: string;
};

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

export default function Room({
  participants,
  isConnected,
  duration,
  lang,
}: Props) {
  // lang
  const isEn = isEnglish(lang);

  // router
  const router = useRouter();

  // hms actions
  const hmsActions = useHMSActions();

  // states
  const isMicOn = useHMSStore(selectIsLocalAudioEnabled);
  const [unblocked, setUnblocked] = React.useState(false);
  const [isDeafened, setIsDeafened] = React.useState(false);
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();

  // join or leave notifications sound
  const notification = useHMSNotifications();

  // toggle mute
  const handleMuteToggle = async () => {
    try {
      // toggle state
      await hmsActions.setLocalAudioEnabled(!isMicOn);
      // toggle sound
      playRoomSound(isMicOn ? "toggle-close" : "toggle-open");
    } catch {
      // return
      return null;
    }
  };

  // handle closing sound
  const handleDeafenToggle = async () => {
    // toggle deafened
    hmsActions.setVolume(isDeafened ? 100 : 0);

    // update state
    setIsDeafened(!isDeafened);

    // toggle sound
    playRoomSound(isDeafened ? "toggle-open" : "toggle-close");
  };

  // handle output change
  const handleAudioOutputChange = async (deviceId: string) => {
    try {
      await updateDevice({
        deviceId,
        deviceType: DeviceType.audioOutput,
      });
    } catch {
      // return
      return null;
    }
  };

  // handle output change
  const handleAudioIntputChange = async (deviceId: string) => {
    try {
      await updateDevice({
        deviceId,
        deviceType: DeviceType.audioInput,
      });
    } catch {
      // return
      return null;
    }
  };

  // handle leaving call
  const handleLeaveCall = () => {
    try {
      // leave
      hmsActions.leave();
      // redirect
      router.push("/");
    } catch {
      // return
      return null;
    }
  };

  React.useEffect(() => {
    if (!notification) return;

    if (
      notification.type === HMSNotificationTypes.PEER_JOINED &&
      !notification.data.isLocal
    ) {
      playRoomSound("join");
    }

    if (
      notification.type === HMSNotificationTypes.PEER_LEFT &&
      !notification.data.isLocal
    ) {
      playRoomSound("leave");
    }
  }, [notification]);

  // loading
  if (!isConnected) return <SkeletonAudioRoom />;

  return (
    <div className="flex flex-col">
      {/* warning count down */}
      <RoomEndingCountdown duration={duration + 5} />

      {/* Header */}
      <div className="border-b bg-gray-50 backdrop-blur-sm">
        <div className="container mx-auto px-2 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-slate-700 tracking-wide">
                  {isEn ? "meeting Room" : "غرفة الاجتماعات"}
                </span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {participants.length} {isEn ? "participants" : "عدد المشاركين"}
              </Badge>
            </div>
            {/* devices */}
            <div className="flex justify-center items-center gap-2">
              {/* change output audio settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    {isEn ? "Audio Output" : "مخرج الصوت"}
                  </div>
                  {allDevices?.audioOutput &&
                  allDevices.audioOutput.length > 0 ? (
                    <>
                      {allDevices.audioOutput.map((device) => {
                        const isSelected =
                          selectedDeviceIDs?.audioOutput === device.deviceId;
                        if (allDevices.audioOutput)
                          return (
                            <DropdownMenuItem
                              key={device.deviceId}
                              onClick={() =>
                                handleAudioOutputChange(device.deviceId)
                              }
                              className={`cursor-pointer ${
                                isSelected ? "bg-gray-100" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && <Check className="h-4 w-4" />}
                                <span>
                                  {device.label ||
                                    (isEn
                                      ? `Speaker ${
                                          allDevices.audioOutput.indexOf(
                                            device,
                                          ) + 1
                                        }`
                                      : `سماعة ${
                                          allDevices.audioOutput.indexOf(
                                            device,
                                          ) + 1
                                        }`)}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          );
                      })}
                    </>
                  ) : (
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground"
                    >
                      {isEn
                        ? "No audio devices found"
                        : "لم يتم العثور على أجهزة صوت"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              {/* change intput audio settings */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-semibold">
                    {isEn ? "Audio intput" : "مدخل الصوت"}
                  </div>
                  {allDevices?.audioInput &&
                  allDevices.audioInput.length > 0 ? (
                    <>
                      {allDevices.audioInput.map((device) => {
                        const isSelected =
                          selectedDeviceIDs?.audioInput === device.deviceId;
                        if (allDevices.audioInput)
                          return (
                            <DropdownMenuItem
                              key={device.deviceId}
                              onClick={() =>
                                handleAudioIntputChange(device.deviceId)
                              }
                              className={`cursor-pointer ${
                                isSelected ? "bg-gray-100" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isSelected && <Check className="h-4 w-4" />}
                                <span>
                                  {device.label ||
                                    (isEn
                                      ? `Speaker ${
                                          allDevices.audioInput.indexOf(
                                            device,
                                          ) + 1
                                        }`
                                      : `سماعة ${
                                          allDevices.audioInput.indexOf(
                                            device,
                                          ) + 1
                                        }`)}
                                </span>
                              </div>
                            </DropdownMenuItem>
                          );
                      })}
                    </>
                  ) : (
                    <DropdownMenuItem
                      disabled
                      className="text-muted-foreground"
                    >
                      {isEn
                        ? "No audio devices found"
                        : "لم يتم العثور على أجهزة صوت"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      {/* unblock sound */}
      <Button
        onClick={async () => {
          // unblock
          await hmsActions.unblockAudio();
          // hide unblock
          setUnblocked(true);
        }}
        className={cn(unblocked && "hidden!", "flex mt-4 text-xs mx-auto")}
        variant="outline"
      >
        تواجه مشكلة في سماع الصوت اضغط هنا
      </Button>
      {/* main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
          {participants.map((participant) => (
            <ParticipantCard
              key={participant.id}
              participant={participant}
              isEn={isEn}
            />
          ))}
        </div>
      </div>

      {/* controls */}
      <div className="border-t bg-gray-50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 space-y-5">
          {/* duration */}
          <div className="space-y-3">
            {/* timer */}
            <RoomDuration />
            {/* separator  */}
            <Separator className="w-10/12 max-w-72 mx-auto" />
          </div>
          {/* actions buttons */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isMicOn ? "secondary" : "destructive"}
              size="lg"
              onClick={handleMuteToggle}
              className="rounded-full items-center justify-center"
            >
              {isMicOn ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isDeafened ? "destructive" : "secondary"}
              size="lg"
              onClick={handleDeafenToggle}
              className="rounded-full"
            >
              {isDeafened ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleLeaveCall}
              className="rounded-full"
            >
              <Phone className="h-5 w-5 rotate-135" />
            </Button>
          </div>

          {/* sound labels */}
          <div className="flex items-center justify-center mt-3 gap-6 text-sm text-muted-foreground">
            <span>
              {isMicOn ? (isEn ? "Muted" : "مغلق") : isEn ? "Unmuted" : "مفتوح"}
            </span>
            <span>
              {isDeafened
                ? isEn
                  ? "Deafened"
                  : "الصوت مغلق"
                : isEn
                  ? "Audio On"
                  : "الصوت يعمل"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParticipantCard({
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
  const isMicOn = !audioTrack?.enabled;

  // translate role
  const translateRole = (role: UserRole, isEn: boolean = false): string => {
    return roles[role]?.[isEn ? "en" : "ar"] || role;
  };

  // check if speaking
  const isSpeaking = useHMSStore(selectPeerAudioByID(participant.id)) > 0;

  // metdata
  const metadata = participant.metadata ? JSON.parse(participant.metadata) : {};

  // role
  const role = translateRole(metadata.user.role, isEn);

  // image
  const image = metadata.user.image ?? null;

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
            {isMicOn && (
              <div className="absolute -bottom-1 -right-1 bg-red-500 rounded-full p-1">
                <MicOff className="h-3 w-3 text-white" />
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <div className="flex items-center gap-1 justify-center">
              <p className="font-medium text-sm truncate max-w-[120px]">
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
