"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => !disabled && router.back()}
      disabled={disabled}
      className={`w-full px-6 py-3 rounded bg-gray-500 text-white font-semibold transition-opacity ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-600"
      }`}
    >
      LOGOUT
    </button>
  );
}
