import Image from "next/image";

export default function Home() {
  return (
    <div className="flex h-screen flex-col items-center justify-between py-12 px-4">
      <h1 className="text-5xl font-bold tracking-tight">WHO&apos;S THERE?</h1>
      <Image
        src="/Door Closed.png"
        alt="Closed door"
        width={250}
        height={450}
        priority
      />
      <div className="w-full max-w-lg rounded-lg border border-foreground/10 bg-foreground/5 p-6">
        <p className="text-center text-foreground/60">No messages yet.</p>
      </div>
      <input
        type="text"
        placeholder="Type a message..."
        className="w-full max-w-lg rounded-lg border border-foreground/10 bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/40 outline-none focus:border-foreground/30"
      />
    </div>
  );
}
