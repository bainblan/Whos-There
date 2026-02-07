export default function AccessStatus({ status }: { status: "NONE" | "GRANTED" | "DENIED" }) {
  if (status === "NONE") return null;

  return (
    <div
      className={`w-full px-6 py-3 rounded text-center text-lg font-mono font-bold transition-all ${
        status === "GRANTED"
          ? "bg-green-100 text-green-700 border border-green-200"
          : "bg-red-100 text-red-700 border border-red-200"
      }`}
    >
      {status === "GRANTED" ? "ACCESS GRANTED" : "ACCESS DENIED"}
    </div>
  );
}
