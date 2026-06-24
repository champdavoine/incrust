/* Incrust — landing page. One screen, punchy, on-brand. */

function Logo({ className = "" }) {
  return (
    <svg viewBox="0 0 1024 1024" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1c1a12" />
          <stop offset="1" stopColor="#100f0a" />
        </linearGradient>
        <clipPath id="bubble">
          <circle cx="336" cy="602" r="150" />
        </clipPath>
      </defs>
      <rect x="96" y="96" width="832" height="832" rx="208" fill="url(#bg)" />
      <rect x="232" y="250" width="560" height="350" rx="40" fill="#ece9e1" />
      <circle cx="336" cy="602" r="172" fill="#14130d" />
      <circle cx="336" cy="602" r="150" fill="#f2c500" />
      <g clipPath="url(#bubble)" fill="#14130d">
        <circle cx="336" cy="544" r="46" />
        <ellipse cx="336" cy="721" rx="104" ry="111" />
      </g>
    </svg>
  );
}

/* The product, shown not told: a screen recording with the detoured
   person floating over it as a yellow bubble. */
function Mockup() {
  return (
    <div className="relative w-full max-w-xl">
      {/* screen frame */}
      <div className="rounded-[26px] border border-[rgba(20,19,13,0.08)] bg-panel p-3 shadow-[0_2px_4px_rgba(20,19,13,0.04),0_30px_60px_-20px_rgba(20,19,13,0.25)]">
        {/* title bar */}
        <div className="flex items-center gap-2 px-2 pb-3 pt-1">
          <span className="h-3 w-3 rounded-full bg-rec" />
          <span className="h-3 w-3 rounded-full bg-accent" />
          <span className="h-3 w-3 rounded-full bg-line" />
          <div className="ml-3 flex items-center gap-2 text-[11px] font-semibold tracking-wide text-muted">
            <span className="animate-rec inline-block h-2 w-2 rounded-full bg-rec" />
            REC&nbsp;·&nbsp;02:14
          </div>
        </div>

        {/* "screen" content — abstract dashboard */}
        <div className="relative overflow-hidden rounded-2xl bg-panel-2 p-5">
          <div className="mb-4 h-3 w-28 rounded-full bg-line" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 rounded-xl bg-bg" />
            <div className="h-20 rounded-xl bg-bg" />
            <div className="h-20 rounded-xl bg-ink/90" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-2.5 w-full rounded-full bg-line/70" />
            <div className="h-2.5 w-4/5 rounded-full bg-line/70" />
            <div className="h-2.5 w-2/3 rounded-full bg-line/70" />
          </div>

          {/* the detoured person, floating */}
          <div className="animate-float absolute -bottom-3 right-4">
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-accent shadow-[0_18px_40px_-10px_rgba(20,19,13,0.5)] ring-4 ring-ink">
              <div className="absolute left-1/2 top-7 h-11 w-11 -translate-x-1/2 rounded-full bg-ink" />
              <div className="absolute left-1/2 top-[72px] h-24 w-28 -translate-x-1/2 rounded-[50%] bg-ink" />
            </div>
          </div>
        </div>
      </div>

      {/* floating caption chip */}
      <div className="absolute -left-4 top-10 hidden rotate-[-4deg] rounded-xl border border-[rgba(20,19,13,0.06)] bg-panel px-3 py-2 text-xs font-semibold shadow-lg sm:block">
        Fond découpé en direct ✂️
      </div>
    </div>
  );
}

function Feature({ title, children }) {
  return (
    <div className="rounded-2xl border border-[rgba(20,19,13,0.05)] bg-panel p-5 shadow-[0_1px_2px_rgba(20,19,13,0.03),0_6px_18px_rgba(20,19,13,0.04)]">
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export default function Page() {
  return (
    <main className="mx-auto max-w-6xl px-5 sm:px-8">
      {/* nav */}
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-9 w-9" />
          <span className="text-lg font-extrabold tracking-tight">Incrust</span>
        </div>
        <a
          href="#download"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
        >
          Télécharger
        </a>
      </header>

      {/* hero */}
      <section className="grid items-center gap-12 py-12 sm:py-20 lg:grid-cols-2">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            macOS · Windows · App native
          </div>

          <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
            Ton écran.
            <span className="block text-muted">Toi dedans.</span>
          </h1>

          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted">
            Incrust capture ton écran et ta webcam, découpe le fond en temps
            réel et t'incruste en bulle flottante sur l'écran. Enregistré
            directement en <span className="font-semibold text-ink">MP4</span>.
            Pas de fond vert, pas de montage.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#download"
              className="rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-bg shadow-[0_10px_30px_-8px_rgba(20,19,13,0.5)] transition-transform hover:-translate-y-0.5"
            >
              Télécharger gratuitement
            </a>
            <a
              href="#how"
              className="rounded-full border border-line px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-panel"
            >
              Voir comment ça marche
            </a>
          </div>

          <p className="mt-4 text-xs font-medium text-muted">
            Gratuit · Tout reste sur ta machine · Aucun compte
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Mockup />
        </div>
      </section>

      {/* features */}
      <section className="py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature title="Détourage temps réel">
            Le fond de ta webcam disparaît à la volée. Détourage GPU via
            MediaPipe — aucun green screen requis.
          </Feature>
          <Feature title="Sortie MP4 directe">
            H.264/AAC prêt pour QuickTime, Final Cut, Premiere ou iMovie.
            Conversion automatique si besoin.
          </Feature>
          <Feature title="Suivi de souris natif">
            La bulle peut suivre ton curseur pour guider le regard pile où ça
            se passe.
          </Feature>
          <Feature title="Vertical ou horizontal">
            Format paysage pour YouTube, vertical pour les Shorts et Reels. Un
            clic.
          </Feature>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="py-16">
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
          Trois étapes. Zéro montage.
        </h2>
        <div className="mt-10 grid gap-8 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Lance la capture",
              d: "Choisis l'écran ou la fenêtre à partager, autorise la webcam et le micro.",
            },
            {
              n: "02",
              t: "Ajuste en direct",
              d: "Position, taille, lissage des bords, ombre — tout se règle pendant l'aperçu.",
            },
            {
              n: "03",
              t: "Enregistre & exporte",
              d: "Stop & save te sort un .mp4 prêt à publier. C'est tout.",
            },
          ].map((s) => (
            <div key={s.n}>
              <div className="text-5xl font-black text-accent">{s.n}</div>
              <h3 className="mt-3 text-lg font-bold tracking-tight">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* download CTA */}
      <section id="download" className="py-16">
        <div className="overflow-hidden rounded-[28px] bg-ink px-8 py-14 text-center text-bg sm:px-16">
          <Logo className="mx-auto h-14 w-14" />
          <h2 className="mt-6 text-3xl font-black tracking-tight sm:text-5xl">
            Incruste-toi maintenant.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-bg/70">
            Télécharge l'app native, lance ta première capture en moins d'une
            minute.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#"
              className="rounded-full bg-accent px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5"
            >
              Télécharger pour macOS
            </a>
            <a
              href="#"
              className="rounded-full border border-bg/25 px-7 py-3.5 text-sm font-bold text-bg transition-colors hover:bg-bg/10"
            >
              Télécharger pour Windows
            </a>
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-line py-8 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="font-semibold text-ink">Incrust</span>
        </div>
        <p>Capture · Détoure · Incruste · Enregistre</p>
        <p>© 2026 Incrust</p>
      </footer>
    </main>
  );
}
