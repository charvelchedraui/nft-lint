import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-md border border-ink/20 bg-white px-3 text-sm outline-none focus-visible:border-ink",
        className,
      )}
      {...props}
    />
  );
}
