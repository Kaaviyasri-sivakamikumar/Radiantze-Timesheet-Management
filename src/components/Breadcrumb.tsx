"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import React from "react";

export function DynamicBreadcrumbs() {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  const createHref = (index: number) =>
    `/${pathSegments.slice(0, index + 1).join("/")}`;

  return (
    <div className="px-8 py-5">
      <nav aria-label="breadcrumb">
        <Breadcrumb>
          <BreadcrumbList className="flex items-center gap-2">
            {/* Home Link */}
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/"
                className="text-blue-600 hover:underline"
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>

            {/* Dynamic breadcrumbs */}
            {pathSegments.map((segment, index) => {
              const isLast = index === pathSegments.length - 1;
              const href = createHref(index);
              const formattedSegment =
                segment.charAt(0).toUpperCase() + segment.slice(1);

              return (
                <React.Fragment key={href}>
                  {/* Separator (not wrapped in <li>) */}
                  <span className="text-gray-400">/</span>

                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage className="text-gray-500">
                        {formattedSegment}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink
                        href={href}
                        className="text-blue-600 hover:underline"
                      >
                        {formattedSegment}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </nav>
    </div>
  );
}
