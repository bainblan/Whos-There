import Image from "next/image";

export default function Door({ knocking, open, onClose }: { knocking: boolean; open?: boolean; onClose?: () => void }) {
  return (
    <div className="relative h-[700px] shrink-0" onClick={open ? onClose : undefined} style={open ? { cursor: "pointer" } : undefined}>
      <Image
        src={open ? "/Door Open.png" : "/Door Closed.png"}
        alt={open ? "Door open" : "Door closed"}
        width={open ? 621 : 400}
        height={open ? 700 : 700}
        className="h-[700px] w-auto border-white object-contain"
        priority
      />
      {!open && (
        <Image
          src={knocking ? "/knock 45 deg.svg" : "/knock hand.svg"}
          alt={knocking ? "Knocking hand" : "Hand ready to knock"}
          width={130}
          height={130}
          className={`absolute top-1/3 transition-all duration-100 ${knocking ? "right-[40px]" : "right-0"}`}
        />
      )}
    </div>
  );
}
