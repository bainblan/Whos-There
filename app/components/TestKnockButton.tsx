export default function TestKnockButton({ testing, onClick }: { testing: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={testing}
      className={`w-full px-6 py-3 rounded bg-purple-600 text-white font-semibold transition-opacity ${
        testing ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
      }`}
      id="testKnockBtn"
      tabIndex={0}
    >
      {testing
        ? "Testing... (K key = knock, Enter = test match)"
        : "TEST KNOCK"}
    </button>
  );
}
