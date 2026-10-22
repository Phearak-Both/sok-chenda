import Link from "next/link";
import { ArrowRight } from "../icons";

type Props = {
  eyebrow?: string;
  title: string;
  link?: { href: string; label: string };
  align?: "left" | "center";
};

export function SectionHeading({ eyebrow, title, link, align = "left" }: Props) {
  if (align === "center") {
    return (
      <div className="flex flex-col items-center text-center">
        {eyebrow && <p className="eyebrow text-gold">{eyebrow}</p>}
        <h2 className="display mt-4 text-[2.25rem] md:text-5xl">{title}</h2>
      </div>
    );
  }
  return (
    <div className="flex items-end justify-between gap-6">
      <div>
        {eyebrow && <p className="eyebrow text-gold">{eyebrow}</p>}
        <h2 className="display mt-3 text-[2rem] md:text-[2.75rem]">{title}</h2>
      </div>
      {link && (
        <Link href={link.href} className="eyebrow link-line mb-2 hidden shrink-0 items-center gap-2 sm:inline-flex">
          {link.label} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
