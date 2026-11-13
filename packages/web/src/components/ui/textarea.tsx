import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-64 w-full rounded-md border border-ink/20 bg-white px-3 py-2 font-mono text-xs leading-5 outline-none focus-visible:border-ink",
        className,
      )}
      {...props}
    />
  );
}
