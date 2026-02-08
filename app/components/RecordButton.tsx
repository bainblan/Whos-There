import MagicButton from "./MagicButton";

export default function RecordButton({ recording, onClick }: { recording: boolean; onClick: () => void }) {
  return (
    <div className="flex w-full gap-4">
      <button
        onClick={onClick}
        disabled={recording}
        className={`flex-1 px-6 py-3 rounded bg-yellow-500 cursor-pointer text-white font-semibold transition-opacity ${
          recording ? "opacity-50 cursor-not-allowed" : "hover:bg-yellow-600"
        }`}
        id="recordBtn"
        tabIndex={0}
      >
        {recording
          ? "Recording... (K key = knock, Enter = done)"
          : "RECORD"}
      </button>
      <MagicButton />
    </div>
  );
}
