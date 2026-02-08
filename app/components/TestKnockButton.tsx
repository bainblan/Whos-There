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

  if (testing) {
    return (
      <button
        disabled
        className="w-full px-6 py-3 rounded bg-purple-600 text-white font-semibold opacity-50 cursor-not-allowed"
        id="testKnockBtn"
        tabIndex={0}
      >
        Testing... (K key = knock, Enter = test match)
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full btn-flip cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      data-front="KNOCK"
      data-back="KNOCK"
      style={{
        "--flip-front-bg": "#9333ea",
        "--flip-front-color": "#ffffff",
        "--flip-back-bg": "#ffffff",
        "--flip-back-color": "#9333ea",
      } as React.CSSProperties}
      id="testKnockBtn"
      tabIndex={0}
    />
  );
}
