import Link from 'next/link';

interface Props {
  title: string;
  subtitle?: string;
  href: string;
}

export default function SectionHeader({ title, subtitle, href }: Props) {
  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-neutral-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>

      <Link
        href={href}
        className="text-sm font-medium text-red-500 hover:text-red-400 transition"
      >
        View all →
      </Link>
    </div>
  );
}
