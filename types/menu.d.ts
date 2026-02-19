// sidebar item
export interface SideBarItem {
  title: string;
  url: string;
}

// sidebar drop down menu
export interface SidebarDropMenu {
  title: string;
  url: string;
  icon: ElementType;
  isActive: boolean;
  items: SideBarItem[];
}
