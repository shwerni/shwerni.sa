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
import { v4 as uuidv4 } from "uuid";

// components
import Room from "./room";
import Section from "../../shared/section";
import { toast } from "@/components/shared/toast";
import { Separator } from "@/components/ui/separator";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { CreateHMSToken } from "@/lib/api/100ms";

// types
import { Lang } from "@/types/types";
import { Reservation } from "@/types/admin";
import OrderInfo, { OrderInfoRow } from "../../shared/order-info";
import { Hash, User } from "lucide-react";
import { FaUserDoctor } from "react-icons/fa6";

type RoomUser = {
  id: string | null;
  name: string;
  role: UserRole;
  image: string | null;
};
// props
interface Props {
  order: Reservation;
  lang: Lang;
  user: RoomUser;
  duration: string;
}

export default function MeetingRoom({ order, user, duration, lang }: Props) {
  // id
  const id = user.id ?? `guest-${uuidv4()}`;

  // hms action hook
  const hmsActions = useHMSActions();

  // conected states
  const isConnected = useHMSStore(selectIsConnectedToRoom);

  // participants
  const peers = useHMSStore(selectPeers);

  // hanlde join room
  const joinRoom = async () => {
    try {
      // get token
      const auth = await CreateHMSToken(order.id, order.oid, id);

      // join
      if (auth)
        await hmsActions.join({
          userName: user.name ?? "مستخدم شاورني",
          authToken: auth,
          settings: {
            isAudioMuted: false,
            isVideoMuted: true,
          },
          metaData: JSON.stringify({ user }),
        });

      // return
      return true;
    } catch {
      // toast
      toast.error({ message: "حدث خطأ ما, برجاء تحديث الصفحة" });
      // return
      return false;
    }
  };

  // on load
  React.useEffect(() => {
    // join room
    joinRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hmsActions]);

  return (
    <div className="">
      <Section className=" max-w-3xl px-3 sm:px-5 mx-auto">
        <div className="max-w-4xl space-y-8 mx-auto">
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="w-full text-center space-y-3">
              <h2 className="text-theme text-3xl font-bold">اجتماع</h2>
              <Separator className="w-11/12 max-w-32 h-1! bg-gray-400 mx-auto" />
            </div>
            <div className="grid grid-cols-3 justify-items-center items-center justify-center gap-2">
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
          <Room
            lang={lang}
            participants={peers}
            isConnected={isConnected ?? false}
            duration={Number(duration)}
          />
        </div>
      </Section>
    </div>
  );
}
