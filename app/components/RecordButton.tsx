import MagicButton from "./MagicButton";

export default function RecordButton({
  recording,
  onClick,
  disabled: externalDisabled = false,
  onMagicGenerated,
  onMagicError,
}: {
  recording: boolean;
  onClick: () => void;
  disabled?: boolean;
  onMagicGenerated: (intervals: number[], description: string | null) => void;
  onMagicError: (message: string) => void;
}) {
  const disabled = recording || externalDisabled;
  return (
    <div className="flex w-full gap-4">
      {recording ? (
        <button
          onClick={onClick}
          disabled={disabled}
          className="flex-1 px-6 py-3 rounded bg-yellow-500 cursor-pointer text-white font-semibold opacity-50 cursor-not-allowed"
          id="recordBtn"
          tabIndex={0}
        >
          Recording... (K key = knock, Enter = done)
        </button>
      ) : (
        <button
          onClick={onClick}
          disabled={disabled}
          className={`flex-1 btn-flip cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          data-front="RECORD"
          data-back="RECORD"
          style={{
            "--flip-front-bg": "#eab308",
            "--flip-front-color": "#ffffff",
            "--flip-back-bg": "#ffffff",
            "--flip-back-color": "#eab308",
          } as React.CSSProperties}
          id="recordBtn"
          tabIndex={0}
        />
      )}
      <MagicButton disabled={disabled} onGenerated={onMagicGenerated} onError={onMagicError} />
    </div>
  );
}
