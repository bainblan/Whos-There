"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="w-full px-6 py-3 rounded bg-gray-500 text-white font-semibold hover:bg-gray-600 cursor-pointer"
    >
      LOGOUT
    </button>
  );
}
