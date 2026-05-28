const COLORS: Record<number, string> = {
  1: "bg-yellow-400 text-yellow-900",
  2: "bg-gray-300 dark:bg-gray-500 text-gray-800 dark:text-white",
  3: "bg-amber-600 text-white",
};

interface Props {
  rank: number;
}

export default function Badge({ rank }: Props) {
  const cls = COLORS[rank] ?? "bg-black/60 text-white";
  return (
    <span className={`inline-flex items-center justify-center text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.5rem] ${cls}`}>
      #{rank}
    </span>
  );
}
