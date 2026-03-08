"use client";
// React & Next
import React from "react";
import { useRouter } from "next/navigation";

// packages
import {
  HMSPeer,
  useHMSStore,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import RoomDuration from "./duration";
// import RoomEndingCountdown from "./countdown";
import AudioDeviceMenu from "./audio-list";
import ParticipantCard from "./participant-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import SkeletonAudioRoom from "@/components/clients/meetings/room/skeleton";

// utils
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
  RefreshCw,
  WifiOff,
  Loader2,
  ShieldAlert,
} from "lucide-react";

// props
interface Props {
  lang: Lang;
  isConnected: boolean;
  duration: number;
  participants: HMSPeer[];
}

export default function Room({
  participants,
  isConnected,
  // duration,
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
  const [isDeafened, setIsDeafened] = React.useState(false);
  const { allDevices, selectedDeviceIDs, updateDevice } = useDevices();

  // conniction state
  type ConnectionStatus = "connected" | "reconnecting" | "failed";
  const [connectionStatus, setConnectionStatus] =
    React.useState<ConnectionStatus>("connected");
  // mic permission state
  const [micPermission, setMicPermission] = React.useState<
    "granted" | "denied" | "prompt" | "unknown"
  >("unknown");

  // join or leave notifications sound
  const notification = useHMSNotifications();

  // handle closing sound
  const handleDeafenToggle = async () => {
    // toggle deafened
    hmsActions.setVolume(isDeafened ? 100 : 0);

    // update state
    setIsDeafened(!isDeafened);

    // toggle sound
    playRoomSound(isDeafened ? "toggle-open" : "toggle-close");
  };

  // handle audio input / output change
  const handleDeviceChange = async (deviceId: string, type: DeviceType) => {
    try {
      await updateDevice({ deviceId, deviceType: type });
    } catch {
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

  // mic permission
  const handleRequestMicPermission = async () => {
    try {
      await hmsActions.setLocalAudioEnabled(true);
      setMicPermission("granted");
      playRoomSound("toggle-open");
    } catch (err: unknown) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setMicPermission("denied");
      }
    }
  };

  // toggle mute
  const handleMuteToggle = async () => {
    // re-query permission live on every tap so we always reflect the
    if (navigator?.permissions) {
      try {
        const status = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        if (status.state === "denied") {
          // hard-blocked — no prompt is possible, show banner and stop
          setMicPermission("denied");
          return;
        }

        // "granted" or "prompt": clear any existing banner so it doesn't
        // linger after the user has already fixed the permission
        setMicPermission("granted");
      } catch {
        // permissions API unsupported — fall through, let HMS handle it
      }
    }

    playRoomSound(isMicOn ? "toggle-close" : "toggle-open");
    try {
      // for "prompt" state, setLocalAudioEnabled internally calls
      // getUserMedia which triggers the native browser permission dialog
      await hmsActions.setLocalAudioEnabled(!isMicOn);
    } catch (err: unknown) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        // user denied the prompt — show the banner
        setMicPermission("denied");
      }
    }
  };

  React.useEffect(() => {
    if (!notification) return;

    switch (notification.type) {
      case HMSNotificationTypes.PEER_JOINED:
        if (!notification.data.isLocal) playRoomSound("join");
        break;

      case HMSNotificationTypes.PEER_LEFT:
        if (!notification.data.isLocal) playRoomSound("leave");
        break;

      case HMSNotificationTypes.RECONNECTING:
        setConnectionStatus("reconnecting");
        break;

      case HMSNotificationTypes.RECONNECTED:
        setConnectionStatus("connected");

        hmsActions.unblockAudio().catch(() => null);
        break;

      case HMSNotificationTypes.ERROR:
        // @ts-expect-error: isFatal may not be typed in all SDK versions
        if (notification.data?.isFatal) {
          setConnectionStatus("failed");
        }
        break;
    }
  }, [notification, hmsActions]);

  // loading
  if (!isConnected) return <SkeletonAudioRoom />;

  return (
    <div className="flex flex-col">
      {/* warning count down // later */}
      {/* <RoomEndingCountdown duration={duration + 5} /> */}

      {/* connection status */}
      {connectionStatus === "reconnecting" && (
        <div className="flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-3 text-yellow-700 text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{isEn ? "Reconnecting…" : "جاري إعادة الاتصال…"}</span>
        </div>
      )}

      {/* connection status */}
      {connectionStatus === "failed" && (
        <div className="flex items-center justify-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-3 text-red-700 text-sm font-medium">
          <WifiOff className="h-4 w-4" />
          <span>
            {isEn
              ? "Connection lost. Please refresh."
              : "انقطع الاتصال، برجاء تحديث الصفحة."}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => window.location.reload()}
          >
            {isEn ? "Refresh" : "تحديث"}
          </Button>
        </div>
      )}

      {/* mic permission */}
      {micPermission === "denied" && (
        <div className="flex flex-col items-center gap-1 max-w-md mx-auto bg-orange-50 border border-orange-200 rounded-lg px-4 py-3 mb-2 text-orange-800 text-sm">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3">
            <div className="flex items-center gap-2 font-medium">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>
                {isEn
                  ? "Microphone access is blocked"
                  : "تم حظر الوصول إلى الميكروفون"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-orange-300 text-orange-800 hover:bg-orange-100"
                onClick={handleRequestMicPermission}
              >
                <Mic className="h-3 w-3 mr-1" />
                {isEn ? "Allow microphone" : "السماح بالميكروفون"}
              </Button>
            </div>
          </div>
          <span className="text-xs font-medium text-amber-600">
            {isEn
              ? "or enable it manually in browser settings"
              : "أو فعله يدوياً من إعدادات المتصفح"}
          </span>
        </div>
      )}
      {/* header */}
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
              {/* Audio Output */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Volume2 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <AudioDeviceMenu
                  label={isEn ? "Audio Output" : "مخرج الصوت"}
                  devices={allDevices?.audioOutput ?? []}
                  selectedId={selectedDeviceIDs?.audioOutput}
                  onSelect={(id) =>
                    handleDeviceChange(id, DeviceType.audioOutput)
                  }
                  isEn={isEn}
                />
              </DropdownMenu>

              {/* Audio Input */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Mic className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <AudioDeviceMenu
                  label={isEn ? "Audio Input" : "مدخل الصوت"}
                  devices={allDevices?.audioInput ?? []}
                  selectedId={selectedDeviceIDs?.audioInput}
                  onSelect={(id) =>
                    handleDeviceChange(id, DeviceType.audioInput)
                  }
                  isEn={isEn}
                />
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
      {/* main Content */}
      <div className="flex-1 container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-6">
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
              {isMicOn ? (isEn ? "Unmuted" : "مفتوح") : isEn ? "Muted" : "مغلق"}
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
      {/* separator  */}
      <Separator className="w-10/12 max-w-72 mx-auto" />
      {/* refresh hint */}
      <div className="flex justify-center mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="gap-2 text-muted-foreground text-xs"
        >
          <RefreshCw className="h-3 w-3" />
          {isEn
            ? "Having sound issues? Refresh"
            : "مشكلة في الصوت؟ أعد تحميل الصفحة"}
        </Button>
      </div>
    </div>
  );
}
