export default function TestKnockButton({
  testing,
  onClick,
  disabled: externalDisabled = false,
}: {
  testing: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const disabled = testing || externalDisabled;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-3 rounded bg-purple-600 cursor-pointer text-white font-semibold transition-opacity ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-purple-700"
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
