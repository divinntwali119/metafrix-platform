import type { ReactNode } from "react";

interface MemberCoverProps {
  className: string;
  children?: ReactNode;
}

export function MemberCover({ className, children }: MemberCoverProps) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-[#111315] bg-cover bg-center ${className}`}
      style={{ backgroundImage: "url('/metafrix-member-cover.svg')" }}
    >
      {children}
    </div>
  );
}
