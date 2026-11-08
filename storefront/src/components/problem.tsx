import { CircleAlert } from "lucide-react";

// An error message: the error red, an icon, and a role that announces it.
export function Problem({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 text-[13px] leading-[1.45] text-error">
      <CircleAlert className="mt-px size-4 shrink-0" strokeWidth={1.6} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
