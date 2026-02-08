export default function MagicButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`flex-1 px-6 py-3 rounded bg-yellow-500 text-white font-semibold transition-opacity cursor-pointer ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
      }`}
    >
      MAGIC
    </button>
  );
}