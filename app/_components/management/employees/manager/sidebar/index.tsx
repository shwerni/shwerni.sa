"use client";
// React & Next
import React from "react";

// components
import { SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import SideBarLayout from "@/app/_components/management/layout/header/sidebar/sidebar";
import { SideBarMenuGroup } from "@/app/_components/management/layout/header/sidebar";

// constants
import { managerMenu } from "@/constants/menu";

interface Props {
  name: string;
}

// return default
export default function ManagerSideBar({ name }: Props) {
  // url
  const url = "/employees/manager";
  // return component
  return (
    <SideBarLayout lang="ar" user={name}>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden space-y-4">
          {/* reservation */}
          <SideBarMenuGroup
            url={url}
            label="الحجوزات"
            menu={managerMenu.reservation}
          />
          {/* user */}
          <SideBarMenuGroup
            url={url}
            label="المستشارون"
            menu={managerMenu.consultants}
          />
          {/* other  */}
          <SideBarMenuGroup
            url={url}
            label="صفحات اخري"
            menu={managerMenu.other}
          />
        </SidebarGroup>
      </SidebarContent>
    </SideBarLayout>
  );
}
