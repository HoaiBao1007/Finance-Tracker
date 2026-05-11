import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeProps = React.HTMLAttributes<HTMLDivElement>;

export function Badge({ className, ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex w-fit items-center rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em]",
        className,
      )}
      {...props}
    />
  );
}