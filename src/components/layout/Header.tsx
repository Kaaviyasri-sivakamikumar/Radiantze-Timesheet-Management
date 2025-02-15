"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavUser } from "../nav-user";
import { Badge } from "@/components/ui/badge";

const data = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};

export function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-[url('/radiantze-bg.jpg')] bg-cover bg-center text-white py-4 h-16">
      <div className="flex items-center justify-between px-2 w-full">
        {/* Logo (Leftmost) */}
        <a href="https://radiantze.com/" className="flex items-center pl-4">
          <img src="/radiantze-logo.png" alt="Logo" className="w-40 h-8" />
        </a>

        {/* Rightmost Section with Admin Badge and NavUser */}
        <div className="flex items-center space-x-4 pr-4">
          {/* Conditional Admin Badge */}
          {isAdmin && <Badge variant={"secondary"}>Admin</Badge>}

          {/* NavUser */}
          {user && (
            <div className="cursor-pointer">
              <NavUser user={data} />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
