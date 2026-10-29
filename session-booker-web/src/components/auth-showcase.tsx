import Image from "next/image";

export function AuthShowcase({ title, note }: { title: string; note: string }) {
  return (
    <aside className="auth-showcase">
      <Image
        className="auth-showcase-image"
        src="/images/northform-coach-hero.jpg"
        alt="A coach supporting a client through a strength session"
        fill
        sizes="(max-width: 760px) 100vw, 48vw"
      />
      <div className="auth-showcase-copy"><span>STUDIO NORTH · SOFIA</span><h2>{title}</h2><p>{note}</p></div>
      <span className="auth-showcase-caption">NORTHFORM · PERSONAL COACHING</span>
    </aside>
  );
}
