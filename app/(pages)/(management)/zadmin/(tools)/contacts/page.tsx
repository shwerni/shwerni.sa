// React & Next
import React from "react";

// components
import { CopyTextEn } from "@/app/_components/layout/copyText";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BulkSend from "@/app/_components/management/admin/contacts/bulk";

// prisma data
import {
  getAllOwnersContactsAdmin,
  getClientsContactsAdmin,
} from "@/data/admin/tools/contacts";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// icons
import { Phone } from "lucide-react";

// phone table layout
interface PhonesLayoutProps {
  label: string;
  contacts: { name: string | null; phone: string | null }[];
}

const PhonesLayout: React.FC<PhonesLayoutProps> = ({ label, contacts }) => {
  // copy phones
  const phones = Array.from(
    contacts.reduce((set, c) => {
      if (c.phone !== null) {
        set.add(c.phone);
      }
      return set;
    }, new Set<string>()),
  );

  // return
  return (
    <div className="w-full mx-auto space-y-3">
      {/* header */}
      <div className="flex justify-between items-center">
        {/* label */}
        <h3>{label}</h3>
        {/* contacts state */}
        <Select>
          <SelectTrigger className="max-w-40">
            <SelectValue placeholder="status" />
          </SelectTrigger>
          <SelectContent>
            {[{ label: "all", state: PaymentState.PAID }].map((i, index) => (
              <SelectItem key={index} value={i.state} className="lowercase">
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* separtor */}
      <Separator className="w-1/2 max-w-40 mx-auto" />
      {/* contacts table */}
      <ScrollArea className="flex flex-col gap-5 h-96">
        {!contacts || contacts.length === 0 ? (
          <div className="rflex py-2 px-3">
            <h3 className="text-red-400">no contacts</h3>
          </div>
        ) : (
          contacts.map(
            (i, index) =>
              i.phone && (
                <React.Fragment key={index}>
                  <div className="grid grid-cols-2 py-2 px-3">
                    <div className="flex items-center gap-2">
                      <h6 className="font-semibold">{index + 1}</h6>
                      <h3>{i.name}</h3>
                    </div>
                    <div className="flex items-center justify-between gap-1">
                      <h3>{i.phone}</h3>
                      <CopyTextEn text={i.phone} label="" />
                    </div>
                  </div>
                  {/* separtor */}
                  <Separator className="w-10/12 max-w-96 mx-auto" />
                </React.Fragment>
              ),
          )
        )}
      </ScrollArea>
      {/* separtor */}
      <Separator className="w-1/2 max-w-40 mx-auto" />
      {/* phones length */}
      <div className="flex justify-between items-center">
        <h6>length: {phones?.length}</h6>
        <CopyTextEn text={phones.join("\n")} label="copy all phones" />
      </div>
    </div>
  );
};

export default async function Sms() {
  // client contacts
  const clientContacts = await getClientsContactsAdmin();

  // owner contacts
  const ownerContacts = await getAllOwnersContactsAdmin();

  // owner contacts
  const unpaid = await getAllOwnersContactsAdmin();

  // return default
  return (
    <div className="max-w-3xl mx-3 space-y-5">
      <div className="flex items-center gap-1">
        <h3>phones</h3>
        <Phone className="w-4" />
      </div>
      {/* contacts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 justify-items-center gap-20 space-y-3">
        {/* clients */}
        {clientContacts && (
          <PhonesLayout label="paid clients" contacts={clientContacts.paid} />
        )}
        {/* owners */}
        {ownerContacts && (
          <PhonesLayout label="owners" contacts={ownerContacts} />
        )}
        {/* owners */}
        {clientContacts && (
          <PhonesLayout
            label="unpaid clients"
            contacts={clientContacts.unpaid}
          />
        )}
      </div>
      {/* bulk send // later improver */}
      <BulkSend />
    </div>
  );
}
