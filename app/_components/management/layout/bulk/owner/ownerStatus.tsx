// React & Next
import React from "react";

// components
import { ConfrimBtnAdmin } from "@/app/_components/management/layout/confirm";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast as sonner } from "sonner";

// prisma types
import { ConsultantState } from "@/lib/generated/prisma/enums";

// prisma data
import { bulkStatusOwnerAdmin } from "@/data/admin/owner";

// constants
import { coStatus } from "@/constants/admin";

// props
interface Props {
  cids: number[];
}

export default function BulkOwnerStatus({ cids }: Props) {
  // new state
  const [status, setStatus] = React.useState<ConsultantState | null>(null);
  // bulk action
  async function bulkAction() {
    try {
      if (status) {
        await bulkStatusOwnerAdmin(cids, status);
      }
      return true;
    } catch {
      return null;
    }
  }

  // return
  return (
    <div className="w-fit my-3">
      <Label className="text-zgrey-200">bulk status</Label>
      <div className="rflex">
        <div>
          <Select onValueChange={(value) => setStatus(value as ConsultantState)}>
            <SelectTrigger className="w-28 lowercase">
              <SelectValue placeholder="status" />
            </SelectTrigger>
            <SelectContent>
              {coStatus.map((i, index) => (
                <SelectItem key={index} value={i.state} className="lowercase">
                  {i.state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* confrim */}
        <ConfrimBtnAdmin
          onConfirm={bulkAction}
          onSuccess={() => {
            // toast
            sonner.success("owners status has been changed successfully");
            // refresh the page
            window.location.reload();
          }}
          onFailure={() => {
            sonner.error("error occured");
          }}
          item="owner"
        />
      </div>
    </div>
  );
}
