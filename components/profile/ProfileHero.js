import { formatDate, getInitials } from "@/lib/utils";

/**
 * @param {{ user: { name: string, phone: string, memberSince: string, avatarColor?: string } }} props
 */
export function ProfileHero({ user }) {
  return (
    <section className="flex flex-col items-center pt-2 text-center">
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg shadow-[#1B5E20]/30"
        style={{ backgroundColor: user.avatarColor ?? "#1B5E20" }}
        aria-hidden
      >
        {getInitials(user.name)}
      </div>
      <h2 className="mt-3 text-xl font-bold text-[#1A1A1A]">{user.name}</h2>
      <p className="text-sm text-[#6B7280]">{user.phone}</p>
      <p className="mt-0.5 text-xs text-[#6B7280]">
        Member since{" "}
        {formatDate(user.memberSince, { month: "long", year: "numeric" })}
      </p>
    </section>
  );
}
