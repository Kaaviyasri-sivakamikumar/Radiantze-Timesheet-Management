"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { NavUser } from "../nav-user";

const data = {
  name: "shadcn",
  email: "m@example.com",
  avatar: "/avatars/shadcn.jpg",
};
export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-[url('/radiantze-bg.jpg')] bg-cover bg-center text-white py-4 h-16">
      <div className="flex items-center justify-between px-2 w-full">
        {/* Logo (Leftmost with 10px padding) */}

        <a href="https://radiantze.com/" className="flex items-center pl-4">
          <img src="/radiantze-logo.png" alt="Logo" className="w-40 h-8" />
        </a>

        {/* Logout Button (Rightmost with 10px padding) */}
        {/* {user && (
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded pr-4"
          >
            Logout
          </button>
        )} */}

        {user && (
          <div className="cursor-pointer">
            <NavUser user={data} />
          </div>
        )}
      </div>
    </header>
  );
}
