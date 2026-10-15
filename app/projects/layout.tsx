"use client";

import { Suspense } from "react";

export default function ProjectsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading projects...</div>}>{children}</Suspense>
  );
}
