"use client";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Custom_Skeleton = () => (
  // <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl z-20">
  <Skeleton className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl z-20 from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></Skeleton>
  // </div>
);

const Text_Skeleton = () => (
  <Skeleton className=" h-10 rounded-xl z-20 from-neutral-200 dark:from-neutral-900 dark:to-neutral-800 to-neutral-100"></Skeleton>
);

// Skeleton items for loading state
const skeleton_items = Array(4).fill({
  title: <Text_Skeleton />,
  header: <Custom_Skeleton />,
});

// Function to generate items dynamically based on user role
const getItems = (isAdmin) => {
  const commonItems = [
    {
      title: "Manage Timesheets",
      description: "View, update and submit timesheets.",
      header: (
        <div className="w-full h-full flex items-center justify-center">
          <img src="/timesheet.png" className="w-32 h-32" />
        </div>
      ),
      link: "/timesheet-management",
    },
    {
      title: "My Profile",
      description: "My profile.",
      header: (
        <div className="w-full h-full flex items-center justify-center">
          <img src="/profile.png" className="w-32 h-32" />
        </div>
      ),
      link: "/profile",
    },
  ];

  if (isAdmin) {
    return [
      ...commonItems,
      {
        title: "Manage employees",
        description: "View, update, delete employees.",
        header: (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/manage-employee.png" className="w-32 h-32" />
          </div>
        ),
        link: "/employee-management",
      },
      {
        title: "Register new Employee",
        description: "Add new employee to Radiantze.",
        header: (
          <div className="w-full h-full flex items-center justify-center">
            <img src="/register-employee.png" className="w-32 h-32" />
          </div>
        ),
        link: "/employee-management/employee-profile",
      },
    ];
  }

  return commonItems;
};

export default function Home() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen overflow-hidden">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <BentoGrid className="max-w-4xl mx-auto mt-11">
        {skeleton_items.map((item, i) => (
          <BentoGridItem key={i} title={item.title} header={item.header} />
        ))}
      </BentoGrid>
    );
  }

  // Generate items dynamically
  const items = getItems(isAdmin);

  return (
    <BentoGrid className="max-w-4xl mx-auto mt-11">
      {items.map((item, i) => (
        <BentoGridItem
          key={i}
          title={item.title}
          description={item.description}
          header={item.header}
          link={item.link}
        />
      ))}
    </BentoGrid>
  );
}
