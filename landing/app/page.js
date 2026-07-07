/* Incrust — landing. Same retro-hardware language as the app:
   warm greige, massive ink type, physical tiles, yellow only on REC + CTA. */

const DOWNLOAD_URL =
  "https://github.com/champdavoine/incrust/releases/latest/download/Incrust-arm64.dmg";

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

/* The product, shown not told: a faithful miniature of the 2.0 console. */
function AppMockup() {
  const meterHeights = [18, 34, 52, 40, 64, 78, 58, 88, 70, 46, 66, 82, 54, 72, 44, 60, 38, 50, 28, 36, 20];
  return (
    <div className="w-full max-w-2xl rounded-[28px] bg-surface p-3 shadow-[0_2px_4px_rgba(22,21,15,0.05),0_30px_70px_-24px_rgba(22,21,15,0.35)]">
      {/* title bar */}
      <div className="flex items-center gap-2 px-2 pb-2 pt-1">
        <span className="h-3 w-3 rounded-full bg-rec/80" />
        <span className="h-3 w-3 rounded-full bg-signal/80" />
        <span className="h-3 w-3 rounded-full bg-line" />
      </div>

      <div className="flex gap-3">
        {/* console column */}
        <div className="flex w-[42%] flex-col gap-3 rounded-2xl bg-bg p-4">
          <div className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[0.2em] text-muted">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-signal" />
            INCRUST
          </div>
          <div className="text-[26px] font-extrabold leading-[0.92] tracking-tighter sm:text-[32px]">
            Record
            <span className="block text-muted">Screen</span>
          </div>
          <div className="tabular text-lg font-bold tracking-tight sm:text-xl">
            <span className="text-rec">● </span>
            <span className="text-line">00:</span>24:19
          </div>

          {/* meter */}
          <div className="flex h-10 items-center gap-[3px]">
            {meterHeights.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-[2px] bg-ink/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>

          {/* format seg */}
          <div className="grid grid-cols-4 gap-[3px] rounded-lg bg-surface-2 p-[3px] text-center text-[8px] font-bold text-muted">
            <span className="rounded-md py-1.5">Screen</span>
            <span className="rounded-md bg-ink py-1.5 text-surface-2">16:9</span>
            <span className="rounded-md py-1.5">9:16</span>
            <span className="rounded-md py-1.5">1:1</span>
          </div>

          {/* transport tiles */}
          <div className="mt-1 grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center gap-1.5 rounded-xl bg-surface px-2 pb-2 pt-3 shadow-[0_1px_2px_rgba(22,21,15,0.06),0_8px_18px_-8px_rgba(22,21,15,0.25)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[10px] text-surface-2">■</span>
              <span className="text-[7px] font-extrabold tracking-[0.18em]">STOP</span>
            </div>
            <div className="relative flex flex-col items-center gap-1.5 rounded-xl bg-surface px-2 pb-2 pt-3 shadow-[0_1px_2px_rgba(22,21,15,0.06),0_8px_18px_-8px_rgba(22,21,15,0.25)]">
              <span className="animate-rec absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rec" />
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-signal text-[10px] text-ink">■</span>
              <span className="text-[7px] font-extrabold tracking-[0.18em]">REC</span>
            </div>
          </div>
        </div>

        {/* stage */}
        <div className="dot-grid relative flex-1 overflow-hidden rounded-2xl bg-stage p-4">
          {/* abstract shared screen */}
          <div className="rounded-lg bg-surface-2/95 p-3">
            <div className="mb-2 h-2 w-16 rounded-full bg-line" />
            <div className="grid grid-cols-3 gap-2">
              <div className="h-10 rounded-md bg-bg" />
              <div className="h-10 rounded-md bg-bg" />
              <div className="h-10 rounded-md bg-ink/85" />
            </div>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded-full bg-line/70" />
              <div className="h-1.5 w-4/5 rounded-full bg-line/70" />
              <div className="h-1.5 w-2/3 rounded-full bg-line/70" />
            </div>
          </div>

          {/* the cut-out person, floating over the screen */}
          <div className="animate-float absolute bottom-3 right-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-signal shadow-[0_16px_36px_-8px_rgba(0,0,0,0.6)] sm:h-24 sm:w-24">
              <div className="absolute left-1/2 top-5 h-8 w-8 -translate-x-1/2 rounded-full bg-ink sm:h-9 sm:w-9" />
              <div className="absolute left-1/2 top-[52px] h-16 w-20 -translate-x-1/2 rounded-[50%] bg-ink sm:top-[60px]" />
            </div>
          </div>

          {/* rec badge */}
          <div className="tabular absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-rec/90 px-2 py-1 text-[8px] font-bold text-white">
            <span className="animate-rec h-1.5 w-1.5 rounded-full bg-white" />
            REC 24:19
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-extrabold tracking-[0.18em] text-muted">
      {children}
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
      <section className="grid items-center gap-12 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-signal" />
            App native macOS · Gratuit
          </div>

          <h1 className="mt-6 text-6xl font-extrabold leading-[0.92] tracking-tighter sm:text-7xl">
            Capture.
            <span className="block text-muted">Incruste-toi.</span>
          </h1>

          <div className="tabular mt-6 text-3xl font-bold tracking-tight text-muted sm:text-4xl">
            <span className="text-line">00:</span>24:19
            <span className="ml-3 text-sm font-semibold tracking-normal">
              d&rsquo;enregistrement, zéro montage
            </span>
          </div>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
            Incrust capture ton écran et ta webcam, découpe le fond en temps
            réel et t&rsquo;incruste en bulle flottante sur l&rsquo;écran.
            Enregistré directement en{" "}
            <span className="font-semibold text-ink">MP4</span>. Pas de fond
            vert, pas de montage.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={DOWNLOAD_URL}
              className="rounded-full bg-signal px-6 py-3.5 text-sm font-bold text-ink shadow-[0_2px_4px_rgba(22,21,15,0.12),0_14px_34px_-10px_rgba(242,197,0,0.55)] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Télécharger pour macOS
            </a>
            <a
              href="#how"
              className="rounded-full border border-line px-6 py-3.5 text-sm font-semibold transition-colors hover:bg-surface"
            >
              Comment ça marche
            </a>
          </div>

          <p className="mt-4 text-xs font-medium text-muted">
            Apple Silicon · Tout reste sur ta machine · Aucun compte
          </p>
        </div>

        <div className="flex justify-center lg:justify-end">
          <AppMockup />
        </div>
      </section>

      {/* features: asymmetric bento, labels inside, no icon-card grid */}
      <section className="py-16">
        <SectionLabel>CE QUE ÇA FAIT</SectionLabel>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-3xl bg-surface p-7 shadow-[0_1px_2px_rgba(22,21,15,0.04),0_10px_28px_-14px_rgba(22,21,15,0.2)] lg:col-span-2">
            <h3 className="text-2xl font-extrabold tracking-tight">
              Détourage temps réel, sans fond vert
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
              Le fond de ta webcam disparaît à la volée (segmentation
              MediaPipe). Il ne reste que toi, en bulle flottante que tu
              glisses où tu veux sur l&rsquo;écran. La molette en règle la
              taille, directement sur l&rsquo;aperçu.
            </p>
          </div>
          <div className="rounded-3xl bg-ink p-7 text-bg">
            <h3 className="text-2xl font-extrabold tracking-tight">
              MP4 direct
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-bg/65">
              H.264/AAC prêt pour QuickTime, Final Cut, Premiere, iMovie.
              Aucune conversion à faire.
            </p>
          </div>
          <div className="rounded-3xl bg-surface p-7 shadow-[0_1px_2px_rgba(22,21,15,0.04),0_10px_28px_-14px_rgba(22,21,15,0.2)]">
            <h3 className="text-2xl font-extrabold tracking-tight">
              Suivi du curseur
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Le cadrage peut suivre ta souris, natif, pour guider le regard
              pile où ça se passe.
            </p>
          </div>
          <div className="rounded-3xl bg-surface p-7 shadow-[0_1px_2px_rgba(22,21,15,0.04),0_10px_28px_-14px_rgba(22,21,15,0.2)] lg:col-span-2">
            <h3 className="text-2xl font-extrabold tracking-tight">
              16:9, 9:16, 1:1, ou l&rsquo;écran tel quel
            </h3>
            <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-muted">
              Paysage pour YouTube, vertical pour Shorts, Reels et TikTok,
              carré pour les réseaux : un clic, et le zoom recadre en direct en
              1080p propre.
            </p>
          </div>
        </div>
      </section>

      {/* how it works */}
      <section id="how" className="py-16">
        <SectionLabel>TROIS ÉTAPES</SectionLabel>
        <h2 className="mt-4 text-4xl font-extrabold tracking-tighter sm:text-5xl">
          Zéro montage.
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
              d: "Glisse ta bulle où tu veux, molette pour la taille, zoom et format en un clic.",
            },
            {
              n: "03",
              t: "Enregistre",
              d: "REC, puis stop : un .mp4 prêt à publier atterrit où tu veux. C'est tout.",
            },
          ].map((s) => (
            <div key={s.n}>
              <div className="tabular text-5xl font-extrabold tracking-tighter text-line">
                {s.n}
              </div>
              <h3 className="mt-3 text-lg font-bold tracking-tight">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* download */}
      <section id="download" className="py-16">
        <div className="dot-grid overflow-hidden rounded-[28px] bg-stage px-8 py-14 text-center text-bg sm:px-16">
          <Logo className="mx-auto h-14 w-14" />
          <h2 className="mt-6 text-4xl font-extrabold tracking-tighter sm:text-5xl">
            Incruste-toi maintenant.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base leading-relaxed text-bg/70">
            Télécharge l&rsquo;app native, lance ta première capture en moins
            d&rsquo;une minute.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={DOWNLOAD_URL}
              className="rounded-full bg-signal px-7 py-3.5 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Télécharger pour macOS (.dmg)
            </a>
            <span className="rounded-full border border-bg/25 px-5 py-3 text-sm font-semibold text-bg/60">
              Windows : bientôt
            </span>
          </div>
          <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white/5 p-5 text-left text-[13px] leading-relaxed text-bg/70">
            <p className="font-bold text-bg/90">
              Première ouverture sur macOS
            </p>
            <p className="mt-2">
              L&rsquo;app n&rsquo;est pas encore notariée par Apple, macOS peut
              donc bloquer le premier lancement. Fais un clic droit sur
              Incrust.app puis choisis « Ouvrir ». Sur macOS Sequoia : Réglages
              Système, « Confidentialité et sécurité », puis « Ouvrir quand
              même » en bas de la page.
            </p>
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
