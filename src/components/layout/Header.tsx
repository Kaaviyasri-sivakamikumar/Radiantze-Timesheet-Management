"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavUser } from "../nav-user";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "../ui/skeleton";

const data = {
  name: "",
  email: "",
  avatar: "",
};

// const Skeleton = () => (
//   <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></div>
// );

// const Text_Skeleton = () => (
//   <div className="w-56 h-8 rounded-md bg-blue-600"></div>
// );

export function Header() {
  const { user, logout, isAdmin } = useAuth();

  return (
    <header className="bg-[url('/radiantze-bg.jpg')] bg-cover bg-center text-white py-2 h-16">
      <div className="flex items-center justify-between px-2 w-full">
        {/* Logo (Leftmost) */}
        <a
          href="https://radiantze.com/"
          className="flex items-center pl-4 py-2"
        >
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
          {!user && (
            <div className="flex items-center relative z-20">
              <Skeleton className="h-12 w-12 rounded-full bg-gray-300/50 dark:bg-gray-600/50" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px] bg-gray-300/50 dark:bg-gray-600/50" />
                <Skeleton className="h-4 w-[150px] bg-gray-300/50 dark:bg-gray-600/50" />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
