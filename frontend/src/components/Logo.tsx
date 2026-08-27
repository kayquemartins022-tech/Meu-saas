import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "light",
  to,
}: {
  className?: string;
  tone?: "light" | "dark";
  to?: string;
}) {
  const inner = (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-indigo-700 text-white shadow-sm shadow-indigo-900/30">
        <ShieldCheck className="size-5" strokeWidth={2.4} />
      </span>
      <span
        className={cn(
          "text-lg font-extrabold tracking-tight",
          tone === "dark" ? "text-white" : "text-slate-900",
        )}
      >
        Cliente<span className="text-indigo-500">Pro</span>
      </span>
    </span>
  );

  if (to) {
    return (
      <Link to={to} data-testid="brand-logo-link" className="shrink-0">
        {inner}
      </Link>
    );
  }
  return inner;
}
