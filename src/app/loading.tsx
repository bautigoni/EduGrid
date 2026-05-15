import Image from "next/image";

export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#FFF7ED,#FFFFFF_48%,#F0FDF4)] p-6">
      <div className="flex flex-col items-center gap-5">
        <Image src="/logo-mark.png" alt="Horaria" width={96} height={96} className="h-20 w-20 animate-pulse rounded-2xl object-contain" />
        <div className="h-2 w-44 overflow-hidden rounded-full bg-orange-100">
          <div className="h-full w-1/2 animate-[loading-bar_1.2s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,#FDBA74,#86EFAC)]" />
        </div>
      </div>
    </main>
  );
}
