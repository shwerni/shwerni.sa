"use client";
// React & Next
import React from "react";

// components
import { SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import SideBarLayout from "@/app/_components/management/layout/header/sidebar/sidebar";
import { SideBarMenuGroup } from "@/app/_components/management/layout/header/sidebar";

// constants
import { collaboratorMenu } from "@/constants/menu";

interface Props {
  name: string;
}

// return default
export default function CollaboratorSideBar({ name }: Props) {
  // url
  const url = "/collaborator";
  // return component
  return (
    <SideBarLayout lang="ar" user={name}>
      <SidebarContent>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden space-y-4">
          {/* services */}
          <SideBarMenuGroup
            url={url}
            label="collaborator"
            menu={collaboratorMenu.collaborator}
          />
        </SidebarGroup>
      </SidebarContent>
    </SideBarLayout>
  );
}
