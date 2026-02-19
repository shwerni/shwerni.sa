"use client";
// React & Next
import React from "react";

// components
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import SideBarLayout from "@/app/_components/management/layout/header/sidebar/sidebar";
import {
  SideBarMenuGroup,
  SideBarCollapsibleMenu,
} from "@/app/_components/management/layout/header/sidebar";

// constants
import { adminMenu } from "@/constants/menu";

// icons
import { MoreHorizontal } from "lucide-react";

// return default
export default function AdminSideBar() {
  // url
  const url = "/zadmin";

  // return component
  return (
    <SideBarLayout lang="en" user="az">
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden space-y-4">
          {/* reservation */}
          <SideBarMenuGroup
            url={url}
            label="reservation"
            menu={adminMenu.reservation}
          />
          {/* user */}
          <SideBarMenuGroup url={url} label="users" menu={adminMenu.users} />
          {/* consultants */}
          <SideBarMenuGroup
            url={url}
            label="consultants"
            menu={adminMenu.consultants}
          />
          {/* freesession */}
          <SideBarMenuGroup
            url={url}
            label="free sessions"
            menu={adminMenu.freesessions}
          />
        </SidebarGroup>
        {/* centers */}
        <SideBarCollapsibleMenu
          url={url}
          collapsibleMenu={adminMenu.centers}
          label="centers"
        />
        {/* tools */}
        <SideBarCollapsibleMenu
          url={url}
          collapsibleMenu={adminMenu.tools}
          label="tools"
        />
        <SidebarGroup className="group-data-[collapsible=icon]:hidden space-y-4">
          {/* other  */}
          <SideBarMenuGroup url={url} label="other" menu={adminMenu.other} />
          {/* platform */}
          <SideBarMenuGroup
            url={url}
            label="platform"
            menu={adminMenu.platform}
          />
          {/* more soon */}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <MoreHorizontal className="text-sidebar-foreground/70" />
                <span className="capitalize text-xs">more soon</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </SideBarLayout>
  );
}
