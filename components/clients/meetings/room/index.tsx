"use client";
// React & Next
import React from "react";

// pacakges
import {
  useHMSActions,
  useHMSStore,
  selectPeers,
  selectIsConnectedToRoom,
} from "@100mslive/react-sdk";

// components
import Room from "./room";
import Section from "../../shared/section";
import { toast } from "@/components/shared/toast";
import { Separator } from "@/components/ui/separator";
import { OrderInfoRow } from "../../shared/order-info";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { CreateHMSToken } from "@/lib/api/100ms";

// types
import { Lang } from "@/types/types";
import { Reservation } from "@/types/admin";

// icon
import { User, UserPlus } from "lucide-react";
import { FaUserDoctor } from "react-icons/fa6";
import { Button } from "@/components/ui/button";

type RoomUser = {
  id: string | null;
  name: string;
  role: UserRole;
  image: string | null;
};

// props
interface Props {
  lang: Lang;
  mid: string;
  user: RoomUser;
  duration: string;
  order: Reservation;
  participant: string;
}

export default function MeetingRoom({
  order,
  user,
  mid,
  duration,
  lang,
  participant,
}: Props) {
  // room name
  const roomName = order.oid + mid;

  // loading
  const [loading, setLoading] = React.useState(false);

  // hms action hook
  const hmsActions = useHMSActions();

  // conected states
  const isConnected = useHMSStore(selectIsConnectedToRoom);

  // participants
  const allPeers = useHMSStore(selectPeers);

  const peers = React.useMemo(() => {
    const map = new Map<string, (typeof allPeers)[0]>();
    allPeers.forEach((peer) => {
      if (!peer.metadata) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let metadataObj: any;
      try {
        metadataObj = JSON.parse(peer.metadata);
      } catch {
        return;
      }

      const userId = metadataObj.user?.id;
      if (userId) map.set(userId, peer);
    });
    return Array.from(map.values());
  }, [allPeers]);

  // hanlde join room
  const Join = async () => {
    // loading
    setLoading(true);

    try {
      // get token
      const auth = await CreateHMSToken(mid, order.oid, roomName, participant);

      // join
      if (!auth) {
        // toast
        toast.info({
          message: "حدث خطأ اثناء الانضمام الي الغرفة برجاء المحاولة مرة اخري",
        });
        // return
        return;
      }

      // join room
      await hmsActions.join({
        userName: user.name ?? "مستخدم شاورني",
        authToken: auth,
        settings: {
          isAudioMuted: false,
          isVideoMuted: true,
        },
        metaData: JSON.stringify({ user }),
      });

      // unblock sound
      await hmsActions.unblockAudio();

      // return
      return true;
    } catch {
      // toast
      toast.error({ message: "حدث خطأ ما, برجاء تحديث الصفحة" });
      // return
      return false;
    } finally {
      // loading
      setLoading(false);
    }
  };

  return (
    <div className="">
      <Section className=" max-w-3xl px-3 sm:px-5 mx-auto">
        <div className="max-w-4xl space-y-8 mx-auto">
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="w-full text-center space-y-3">
              <h2 className="text-theme text-3xl font-bold">اجتماع</h2>
              <Separator className="w-11/12 max-w-32 h-1! bg-gray-400 mx-auto" />
            </div>
            <div className="grid grid-cols-3 justify-items-center items-center justify-center gap-2 w-10/12 max-w-lg">
              <OrderInfoRow label="الاسم" value={order.name} icon={User} />
              <span> | </span>
              <OrderInfoRow
                label="المستشار"
                value={order.consultant.name}
                icon={FaUserDoctor}
              />
            </div>
          </div>
          <Separator className="w-10/12 mx-auto" />
          {
            // render
            !isConnected ? (
              <div className="flex items-center justify-center px-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 max-w-sm w-full text-center space-y-6">
                  {/* Icon */}
                  <div className="flex justify-center">
                    <UserPlus className="w-16 h-16 text-theme" />
                  </div>

                  {/* Heading */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    انضم للاجتماع
                  </h2>

                  {/* Subtext */}
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    اضغط على الزر أدناه للدخول إلى غرفة الاجتماع. تأكد من السماح
                    بالوصول إلى الصوت.
                  </p>

                  {/* Join Button */}
                  <Button
                    onClick={Join}
                    variant="destructive"
                    className="w-full flex items-center justify-center gap-2"
                    loading={loading}
                    disabled={loading}
                  >
                    <UserPlus className="w-5 h-5" />
                    انضم الآن
                  </Button>
                </div>
              </div>
            ) : (
              <Room
                lang={lang}
                participants={peers}
                isConnected={isConnected ?? false}
                duration={Number(duration)}
              />
            )
          }
        </div>
      </Section>
    </div>
  );
}
