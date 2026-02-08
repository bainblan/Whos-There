export default function ConnectButton({
  connected,
  onClick,
  disabled: externalDisabled = false,
}: {
  connected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const disabled = connected || externalDisabled;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-3 rounded bg-blue-600 text-white font-semibold transition-opacity ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"
      }`}
      id="connectBtn"
    >
      {connected ? "Connected!" : "CONNECT TO SENSOR"}
    </button>
  );
}
