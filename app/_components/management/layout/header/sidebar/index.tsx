// component
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// types
import { SidebarDropMenu } from "@/types/menu";

// icons
import { ChevronRight, MoreHorizontal, Pencil } from "lucide-react";

// sidebar gorup props
interface SideBarMenuGroupProps {
  label: string;
  url: string;
  menu: {
    name: string;
    url: string;
    icon: React.ElementType;
  }[];
}

// menu component
export function SideBarMenuGroup({ label, url, menu }: SideBarMenuGroupProps) {
  return (
    <SidebarMenu>
      <SidebarGroupLabel className="capitalize">{label}</SidebarGroupLabel>
      {/* other  */}
      {menu.map((i) => (
        <SidebarMenuItem key={i.name}>
          <SidebarMenuButton
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            asChild
          >
            <a href={`${url}/${i.url}`}>
              <i.icon className="w-4" />
              <span>{i.name}</span>
            </a>
          </SidebarMenuButton>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuAction showOnHover>
                <MoreHorizontal />
                <span className="sr-only">More</span>
              </SidebarMenuAction>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-48 rounded-lg"
              side="bottom"
              align="end"
            >
              <DropdownMenuItem>
                <Pencil className="w-4 mr-2" />
                <span>{i.name}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

// props
interface SideBarCollapsibleMenuProps {
  label?: string;
  url: string;
  collapsibleMenu: SidebarDropMenu[];
}

// sideBar collapsible menu
export function SideBarCollapsibleMenu({
  label,
  url,
  collapsibleMenu,
}: SideBarCollapsibleMenuProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="capitalize">
        {label ?? "menu"}
      </SidebarGroupLabel>
      <SidebarMenu>
        {collapsibleMenu.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuSubItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <a href={`${url}/${subItem.url}`}>
                          <span>{subItem.title}</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuSubItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
