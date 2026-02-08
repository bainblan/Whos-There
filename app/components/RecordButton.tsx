import MagicButton from "./MagicButton";

export default function RecordButton({
  recording,
  onClick,
  disabled: externalDisabled = false,
}: {
  recording: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const disabled = recording || externalDisabled;
  return (
    <div className="flex w-full gap-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 px-6 py-3 rounded bg-yellow-500 cursor-pointer text-white font-semibold transition-opacity ${
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
        }`}
        id="recordBtn"
        tabIndex={0}
      >
        {recording
          ? "Recording... (K key = knock, Enter = done)"
          : "RECORD"}
      </button>
      <MagicButton disabled={disabled} />
    </div>
  );
}
