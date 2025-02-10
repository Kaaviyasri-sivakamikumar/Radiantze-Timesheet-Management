"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

export function NavUser() {
  const { user, logout } = useAuth();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <a className="border-none bg-transparent outline-none hover:bg-transparent flex items-center gap-2 focus:ring-0 focus:outline-none">
              <UserAvatar name={user?.name || "Unknown"} avatar={user?.avatar} />
              <div className="text-left text-sm leading-tight">
                <span className="block font-semibold">{user?.name}</span>
                <span className="block text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </a>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="min-w-56 rounded-lg" align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-3 py-2 text-sm">
                <UserAvatar name={user?.name || "Unknown"} avatar={user?.avatar} />
                <div className="text-left leading-tight">
                  <span className="block font-semibold">{user?.name}</span>
                  <span className="block text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="flex items-center gap-2 cursor-pointer">
              <LogOut className="size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

// ✅ Fixed Avatar Component
const UserAvatar = ({ name, avatar }: { name: string; avatar?: string }) => (
  <Avatar className="h-8 w-8">
    {avatar ? (
      <AvatarImage src={avatar} alt={name} />
    ) : (
      <AvatarFallback className="rounded-lg bg-red-500">
        {name.charAt(0).toUpperCase()}
      </AvatarFallback>
    )}
  </Avatar>
);
