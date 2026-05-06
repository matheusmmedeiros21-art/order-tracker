import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
  type Variants,
} from "framer-motion";
import {
  Monitor,
  Wifi,
  Lock,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  PlayCircle,
  Activity,
  Users,
  Sparkles,
  FileText,
  Send,
  Check,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * RiseLines — Apple-style "letters rise from below" reveal.
 */
function RiseLines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.12,
  immediate = false,
}: {
  lines: string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewHook = useInView(ref, { once: true, margin: "-15% 0px -15% 0px" });
  const inView = immediate || inViewHook;
  const reduceMotion = useReducedMotion();

  const container: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: reduceMotion ? 0 : stagger,
        delayChildren: reduceMotion ? 0 : delay,
      },
    },
  };

  const lineVar: Variants = reduceMotion
    ? {
        hidden: { y: "0%", opacity: 0 },
        show: { y: "0%", opacity: 1, transition: { duration: 0.2 } },
      }
    : {
        hidden: { y: "110%" },
        show: {
          y: "0%",
          transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] },
        },
      };

  return (
    <motion.div
      ref={ref}
      variants={container}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      className={className}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className="block overflow-hidden"
          style={{ paddingBottom: "0.06em" }}
        >
          <motion.span
            variants={lineVar}
            className={`block will-change-transform ${lineClassName}`}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.div>
  );
}

function RiseFade({
  children,
  delay = 0,
  className = "",
  y = 30,
  immediate = false,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  y?: number;
  immediate?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inViewHook = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  const inView = immediate || inViewHook;
  const reduceMotion = useReducedMotion();
  const hidden = reduceMotion
    ? { opacity: 0, y: 0, filter: "blur(0px)" }
    : { opacity: 0, y, filter: "blur(8px)" };
  const shown = { opacity: 1, y: 0, filter: "blur(0px)" };
  return (
    <motion.div
      ref={ref}
      initial={hidden}
      animate={inView ? shown : hidden}
      transition={{
        duration: reduceMotion ? 0.2 : 1.2,
        delay: reduceMotion ? 0 : delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * CinematicHero — Apple iPad-Pro style sticky scroll showcase.
 * Pinned section where a centered "device" scales up and reduces rotateX
 * while parallax blobs drift behind it. Driven by continuous scroll progress.
 */
function CinematicShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Continuous, eased transforms (cinematic feel)
  const scale = useTransform(scrollYProgress, [0, 0.45, 0.85, 1], [0.78, 1, 1.04, 1.06]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -2]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.2, 1, 1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 1], [40, -40]);

  // Parallax blobs — different speeds
  const blobAY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const blobBY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const blobAOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 1, 0.7]);

  // Caption fade
  const captionOpacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const captionY = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [30, 0, 0, -20]);

  if (reduceMotion) {
    return (
      <section className="relative py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <DeviceMockup />
        </div>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative"
      style={{ height: "120vh" }}
    >
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Parallax background blobs */}
        <motion.div
          aria-hidden
          style={{ y: blobAY, opacity: blobAOpacity }}
          className="absolute -top-32 left-[10%] w-[520px] h-[520px] rounded-full blur-3xl will-change-transform pointer-events-none"
        >
          <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,113,227,0.35),transparent_70%)]" />
        </motion.div>
        <motion.div
          aria-hidden
          style={{ y: blobBY }}
          className="absolute -bottom-32 right-[5%] w-[600px] h-[600px] rounded-full blur-3xl will-change-transform pointer-events-none"
        >
          <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_70%_70%,rgba(125,122,255,0.28),transparent_70%)]" />
        </motion.div>

        {/* Stacked layout: caption on top, device below */}
        <div className="relative h-full w-full flex flex-col items-center justify-start pt-[6vh] md:pt-[8vh] px-6">
          {/* Caption */}
          <motion.div
            style={{ opacity: captionOpacity, y: captionY }}
            className="text-center will-change-transform max-w-3xl"
          >
            <p className="text-[11px] md:text-[12px] font-medium uppercase tracking-[0.25em] text-[#0071E3] mb-2 md:mb-3">
              Em tempo real
            </p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.035em] text-[#1d1d1f] leading-[1.05]">
              Acompanhe sua posição.{" "}
              <span className="text-[#86868b]">Sem ligação. Sem espera.</span>
            </h2>
          </motion.div>

          {/* Device — scales/rotates with scroll */}
          <motion.div
            style={{
              scale,
              rotateX,
              opacity,
              y,
              transformPerspective: 1400,
            }}
            className="relative w-[88vw] max-w-[920px] will-change-transform mt-8 md:mt-12"
          >
            <DeviceMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function DeviceMockup() {
  return (
    <div className="mockup-surface relative rounded-[24px] overflow-hidden border border-black/[0.08] dark:border-white/[0.10] shadow-[0_30px_80px_rgba(0,0,0,0.18),0_8px_20px_rgba(0,113,227,0.12)]">
      {/* Title bar */}
      <div className="mockup-titlebar px-5 py-3 flex items-center gap-2 border-b border-black/[0.05] dark:border-white/[0.06]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <span className="mockup-muted ml-3 text-[11px] tracking-tight">suporte.ti / fila</span>
      </div>

      {/* Body */}
      <div className="p-6 md:p-8 grid grid-cols-3 gap-3 md:gap-4">
        <MockStat icon={<Activity className="w-3.5 h-3.5" />} label="Em atendimento" value="3" accent="var(--mockup-accent-blue)" />
        <MockStat icon={<Users className="w-3.5 h-3.5" />} label="Na fila" value="6" accent="var(--mockup-accent-purple)" />
        <MockStat icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Concluídos" value="12" accent="var(--mockup-accent-green)" />
      </div>

      <div className="px-6 md:px-8 pb-6 md:pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mockup-card rounded-2xl border p-4">
          <div className="mockup-accent flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Sendo atendido
          </div>
          <MockRow position="Agora" name="Maria Silva" cat="Computador" highlight />
        </div>
        <div className="mockup-card rounded-2xl border p-4">
          <div className="mockup-muted flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium mb-3">
            <Users className="w-3.5 h-3.5" />
            Próximos
          </div>
          <div className="space-y-2">
            <MockRow position="2º" name="João Pedro" cat="Impressora" />
            <MockRow position="3º" name="Ana Souza" cat="Rede" mine />
          </div>
        </div>
      </div>
    </div>
  );
}

function MockStat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return (
    <div className="mockup-card rounded-xl border p-3 md:p-4">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-medium" style={{ color: accent }}>
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div className="mockup-fg text-2xl md:text-3xl font-semibold tracking-[-0.03em] mt-1 tabular-nums">{value}</div>
    </div>
  );
}

function MockRow({ position, name, cat, highlight, mine }: { position: string; name: string; cat: string; highlight?: boolean; mine?: boolean }) {
  const tone = mine
    ? "mockup-row mockup-row--mine"
    : highlight
      ? "mockup-row mockup-row--highlight"
      : "mockup-row mockup-row--default";
  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${tone}`}>
      <div className="w-10 text-center">
        {position === "Agora" ? (
          <div className="mockup-accent text-[9px] uppercase tracking-widest font-semibold">Agora</div>
        ) : (
          <div className="mockup-fg text-base font-semibold tabular-nums">{position}</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="mockup-fg text-[12px] font-medium truncate">{name}</span>
          {mine && <span className="mockup-accent text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#0071E3]/15 font-medium">Você</span>}
        </div>
        <div className="mockup-muted text-[10px]">{cat}</div>
      </div>
    </div>
  );
}

/**
 * TicketFlowSection — Cinematic Apple-style scroll storytelling.
 * Sticky scene where a ticket card morphs through 3 stages
 * (empty → filled → resolved) driven by continuous scroll progress.
 * Includes layered depth (ghost cards behind), drifting headline,
 * micro-interactions, and a soft glow at the resolution moment.
 */
function TicketFlowSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  // Map progress 0→1 to the actual pinned scroll window so there is
  // no dead space before/after the animation.
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Headline drift: subtle parallax over the whole sticky scene
  const headlineY       = useTransform(scrollYProgress, [0, 1], ["-2vh", "12vh"]);
  const headlineOpacity = useTransform(scrollYProgress, [0, 0.12, 0.85, 1], [0, 1, 1, 0]);
  const kickerOpacity   = useTransform(scrollYProgress, [0, 0.1, 0.6, 0.75], [0, 1, 1, 0]);

  if (reduceMotion) {
    return (
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-[#0071E3] mb-3">Rápido</p>
            <h3 className="text-3xl md:text-5xl font-semibold tracking-[-0.035em] text-[#1d1d1f]">
              Abre. Descreve. Pronto.
            </h3>
          </div>
          <TicketFlowCardStatic />
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Mobile fallback (below md): static, no sticky/clipping */}
      <section className="md:hidden py-24 px-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-[#0071E3] mb-3">Rápido</p>
          <h3 className="text-3xl font-semibold tracking-[-0.04em] text-[#1d1d1f] leading-[1.05] mb-3">
            Abre. <span className="text-[#86868b]">Descreve.</span> <span className="text-[#0071E3]">Pronto.</span>
          </h3>
          <p className="text-[14px] text-[#6e6e73] mb-10 leading-relaxed">
            Três passos para resolver. Sem ligação, sem espera, sem rodeio.
          </p>
          <TicketFlowCardStatic />
        </div>
      </section>

      {/* Desktop cinematic scene */}
      <section ref={containerRef} className="relative hidden md:block" style={{ height: "180vh" }}>
        <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center">
        {/* Soft ambient gradient that strengthens toward the end */}
        <ResolveGlow progress={scrollYProgress} />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left: headline (drifts subtly with scroll) */}
          <motion.div
            style={{ y: headlineY, opacity: headlineOpacity }}
            className="text-center md:text-left will-change-transform"
          >
            <motion.p
              style={{ opacity: kickerOpacity }}
              className="text-[11px] md:text-[12px] font-medium uppercase tracking-[0.3em] text-[#0071E3] mb-3 md:mb-4"
            >
              Rápido
            </motion.p>
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-[-0.04em] text-[#1d1d1f] leading-[1.02]">
              Abre.{" "}
              <span className="text-[#86868b]">Descreve.</span>{" "}
              <span className="text-[#0071E3]">Pronto.</span>
            </h3>
            <p className="mt-4 md:mt-6 text-[14px] md:text-[16px] text-[#6e6e73] max-w-md mx-auto md:mx-0 leading-relaxed">
              Três passos para resolver. Sem ligação, sem espera, sem rodeio.
            </p>
          </motion.div>

          {/* Right: animated ticket card */}
          <div className="relative" style={{ perspective: 1400 }}>
            <TicketFlowCardAnimated progress={scrollYProgress} />
          </div>
        </div>
      </div>
    </section>
    </>
  );
}

function ResolveGlow({ progress }: { progress: MotionValue<number> }) {
  const blueOpacity  = useTransform(progress, [0, 0.4, 1], [0.4, 0.8, 0.5]);
  const greenOpacity = useTransform(progress, [0.55, 0.85, 1], [0, 0.55, 0.45]);
  const blueX        = useTransform(progress, [0, 1], ["-10%", "5%"]);
  const greenX       = useTransform(progress, [0, 1], ["20%", "0%"]);
  return (
    <>
      <motion.div
        aria-hidden
        style={{ opacity: blueOpacity, x: blueX }}
        className="absolute -top-32 -left-20 w-[640px] h-[640px] rounded-full blur-3xl pointer-events-none will-change-transform"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(0,113,227,0.30),transparent_70%)]" />
      </motion.div>
      <motion.div
        aria-hidden
        style={{ opacity: greenOpacity, x: greenX }}
        className="absolute -bottom-32 -right-20 w-[560px] h-[560px] rounded-full blur-3xl pointer-events-none will-change-transform"
      >
        <div className="w-full h-full rounded-full bg-[radial-gradient(circle_at_70%_70%,rgba(48,209,88,0.32),transparent_70%)]" />
      </motion.div>
    </>
  );
}

/**
 * TicketFlowCardStatic — used on mobile and reduce-motion. No hooks, no scroll.
 */
function TicketFlowCardStatic() {
  return (
    <div className="mockup-surface relative rounded-3xl border border-black/[0.08] dark:border-white/[0.10] shadow-[0_30px_80px_rgba(0,0,0,0.18)] p-6 md:p-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <span className="mockup-fg text-[14px] font-medium">Chamado #128</span>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold rounded-full bg-[#30d158]/15 text-[#1c8a3a] dark:text-[#30d158] px-2.5 py-1">
          <Check className="w-2.5 h-2.5" /> Resolvido
        </span>
      </div>
      <p className="mockup-muted text-[13px]">Impressora não imprime — driver atualizado.</p>
    </div>
  );
}

/**
 * TicketFlowCardAnimated — morphs through draft → sending → resolved as scroll advances.
 * Always called with a real MotionValue, so all hooks run unconditionally.
 */
function TicketFlowCardAnimated({ progress }: { progress: MotionValue<number> }) {
  // Local progress mapped to a comfortable inner window
  const local = useTransform(progress, [0.05, 0.95], [0, 1]);

  // Card depth — outer card scale + ghost layers behind
  const cardScale  = useTransform(local, [0, 0.15, 0.55, 1], [0.94, 1, 1.01, 1.02]);
  const cardY      = useTransform(local, [0, 1], ["8px", "-12px"]);
  const cardRotX   = useTransform(local, [0, 0.5, 1], [4, 0, -1.5]);
  const cardOpac   = useTransform(local, [0, 0.12], [0, 1]);
  const cardBlur   = useTransform(local, [0, 0.12], [8, 0]);
  const cardFilter = useTransform(cardBlur, (b) => `blur(${b}px)`);

  // Ghost cards behind for layered depth
  const ghost1Opacity = useTransform(local, [0, 0.15, 0.9, 1], [0, 0.5, 0.5, 0.3]);
  const ghost2Opacity = useTransform(local, [0, 0.2, 0.9, 1], [0, 0.3, 0.3, 0.15]);
  const ghost1Y       = useTransform(local, [0, 1], ["12px", "20px"]);
  const ghost2Y       = useTransform(local, [0, 1], ["24px", "36px"]);

  // Title field — typed character by character
  const titleStr  = "Impressora não imprime";
  const titleLen  = useTransform(local, [0.18, 0.42], [0, titleStr.length]);
  const [titleShown, setTitleShown] = useState("");
  useMotionValueEvent(titleLen, "change", (v) => {
    setTitleShown(titleStr.slice(0, Math.max(0, Math.round(v))));
  });

  // Description field — typed
  const descStr  = "Aparece erro de driver ao enviar para a fila.";
  const descLen  = useTransform(local, [0.38, 0.62], [0, descStr.length]);
  const [descShown, setDescShown] = useState("");
  useMotionValueEvent(descLen, "change", (v) => {
    setDescShown(descStr.slice(0, Math.max(0, Math.round(v))));
  });

  // Caret blink helpers — show only while typing
  const titleCaretOp = useTransform(local, [0.18, 0.2, 0.42, 0.45], [0, 1, 1, 0]);
  const descCaretOp  = useTransform(local, [0.38, 0.4, 0.62, 0.65], [0, 1, 1, 0]);

  // Submit button: idle → press → fly out
  const btnScale   = useTransform(local, [0.62, 0.72, 0.78], [1, 0.96, 1]);
  const btnY       = useTransform(local, [0.78, 0.84], [0, -8]);
  const btnOpacity = useTransform(local, [0.62, 0.78, 0.86], [1, 1, 0]);

  // Progress bar (sending) — appears between submit and resolve
  const sendOpacity = useTransform(local, [0.78, 0.82, 0.9, 0.93], [0, 1, 1, 0]);
  const sendWidth   = useTransform(local, [0.78, 0.92], ["0%", "100%"]);

  // Resolved overlay — fades in at the end
  const resolvedOpacity = useTransform(local, [0.88, 0.96], [0, 1]);
  const resolvedScale   = useTransform(local, [0.88, 0.96], [0.92, 1]);
  const resolvedY       = useTransform(local, [0.88, 0.96], [16, 0]);

  // Status pill morph (3 crossfaded layers)
  const draftOp    = useTransform(local, [0.12, 0.2, 0.7, 0.78], [0, 1, 1, 0]);
  const sendingOp  = useTransform(local, [0.7, 0.78, 0.88, 0.92], [0, 1, 1, 0]);
  const resolvedOp = useTransform(local, [0.88, 0.96], [0, 1]);

  // Final ring/glow
  const ringOpacity = useTransform(local, [0.9, 1], [0, 0.45]);

  return (
    <div className="relative max-w-md mx-auto">
      {/* Ghost layers behind for depth */}
      <motion.div
        aria-hidden
        style={{ opacity: ghost2Opacity, y: ghost2Y, scale: 0.94 }}
        className="absolute inset-0 mockup-surface rounded-3xl border border-black/[0.05] dark:border-white/[0.05]"
      />
      <motion.div
        aria-hidden
        style={{ opacity: ghost1Opacity, y: ghost1Y, scale: 0.97 }}
        className="absolute inset-0 mockup-surface rounded-3xl border border-black/[0.06] dark:border-white/[0.06]"
      />

      {/* Soft success ring */}
      <motion.div
        aria-hidden
        style={{ opacity: ringOpacity }}
        className="absolute -inset-3 rounded-[28px] pointer-events-none"
      >
        <div className="w-full h-full rounded-[28px] shadow-[0_0_60px_8px_rgba(48,209,88,0.35)]" />
      </motion.div>

      {/* Main card */}
      <motion.div
        style={{
          scale: cardScale,
          y: cardY,
          rotateX: cardRotX,
          opacity: cardOpac,
          filter: cardFilter,
          transformPerspective: 1400,
        }}
        className="relative mockup-surface rounded-3xl border border-black/[0.08] dark:border-white/[0.10] shadow-[0_30px_80px_rgba(0,0,0,0.18),0_8px_20px_rgba(0,113,227,0.10)] p-6 md:p-7 will-change-transform overflow-hidden"
      >
        {/* Header: icon + status pill */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <span className="mockup-fg text-[13px] font-medium">Novo chamado</span>
          </div>
          <div className="relative h-6 w-[88px]">
            <motion.span
              style={{ opacity: draftOp }}
              className="absolute inset-0 inline-flex items-center justify-center text-[10px] uppercase tracking-widest font-semibold rounded-full bg-[#86868b]/15 mockup-muted"
            >
              Rascunho
            </motion.span>
            <motion.span
              style={{ opacity: sendingOp }}
              className="absolute inset-0 inline-flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest font-semibold rounded-full bg-[#0071E3]/15 text-[#0071E3]"
            >
              <Send className="w-2.5 h-2.5" />
              Enviando
            </motion.span>
            <motion.span
              style={{ opacity: resolvedOp }}
              className="absolute inset-0 inline-flex items-center justify-center gap-1 text-[10px] uppercase tracking-widest font-semibold rounded-full bg-[#30d158]/15 text-[#1c8a3a] dark:text-[#30d158]"
            >
              <Check className="w-2.5 h-2.5" />
              Resolvido
            </motion.span>
          </div>
        </div>

        {/* Title field */}
        <div className="mb-4">
          <div className="text-[10px] uppercase tracking-widest mockup-muted font-medium mb-1.5">Título</div>
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] px-3.5 py-2.5 bg-white/40 dark:bg-white/[0.03] min-h-[42px] flex items-center">
            <span className="mockup-fg text-[14px] tabular-nums">{titleShown}</span>
            <motion.span
              style={{ opacity: titleCaretOp }}
              className="inline-block w-[1.5px] h-4 bg-[#0071E3] ml-0.5"
            />
          </div>
        </div>

        {/* Description field */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-widest mockup-muted font-medium mb-1.5">Descrição</div>
          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] px-3.5 py-2.5 bg-white/40 dark:bg-white/[0.03] min-h-[64px]">
            <span className="mockup-fg text-[13px] leading-relaxed">{descShown}</span>
            <motion.span
              style={{ opacity: descCaretOp }}
              className="inline-block w-[1.5px] h-3.5 bg-[#0071E3] ml-0.5 align-middle"
            />
          </div>
        </div>

        {/* Submit button + sending bar */}
        <div className="relative h-11">
          <motion.button
            type="button"
            aria-hidden
            tabIndex={-1}
            style={{ scale: btnScale, y: btnY, opacity: btnOpacity }}
            className="absolute inset-0 rounded-full bg-[#0071E3] text-white text-[13px] font-medium tracking-tight inline-flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(0,113,227,0.35)] will-change-transform"
          >
            Abrir chamado
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
          <motion.div
            style={{ opacity: sendOpacity }}
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[#0071E3]/15 overflow-hidden"
          >
            <motion.div
              style={{ width: sendWidth }}
              className="h-full bg-gradient-to-r from-[#0071E3] to-[#7c3aed]"
            />
          </motion.div>
        </div>

        {/* Resolved overlay */}
        <motion.div
          style={{ opacity: resolvedOpacity, scale: resolvedScale, y: resolvedY }}
          className="absolute inset-0 mockup-surface flex flex-col items-center justify-center text-center px-8 will-change-transform"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#30d158]/15 text-[#30d158] flex items-center justify-center mb-4">
            <Check className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <div className="mockup-fg text-[18px] font-semibold tracking-[-0.02em]">Resolvido</div>
          <div className="mockup-muted text-[13px] mt-1">Chamado #128 · 12 min</div>
        </motion.div>
      </motion.div>
    </div>
  );
}

/**
 * WordsShowcase — Drifting closing phrase ("Você vê a fila. Sempre.").
 * Translucent, fluid, no sticky pinning — moves down with scroll.
 */
function WordsShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Phrase scrolls naturally with the page — NO Y transform so it
  // moves at the exact same rate as the user's scroll.
  // Only fades in/out and gently scales for an Apple-like reveal.
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
  const scale   = useTransform(scrollYProgress, [0, 0.4, 0.6, 1], [0.95, 1, 1, 1.04]);
  const blur    = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [10, 0, 0, 10]);
  const filter  = useTransform(blur, (b) => `blur(${b}px)`);

  if (reduceMotion) {
    return (
      <section className="py-32 px-6 text-center">
        <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-[#0071E3] mb-3">Transparente</p>
        <h3 className="text-3xl md:text-5xl font-semibold tracking-[-0.035em] text-[#1d1d1f]/80">
          Você vê a fila. Sempre.
        </h3>
      </section>
    );
  }

  return (
    <section
      ref={containerRef}
      className="relative py-24 md:py-36 md:-mt-[60vh] z-10 bg-gradient-to-b from-transparent via-white/85 to-white dark:via-black/70 dark:to-black"
    >
      <div className="w-full flex items-center justify-center pointer-events-none">
        <motion.div
          style={{ opacity, scale, filter }}
          className="text-center px-6 will-change-transform"
        >
          <p className="text-[11px] md:text-[12px] font-medium uppercase tracking-[0.3em] text-[#0071E3] mb-3 md:mb-4">
            Transparente
          </p>
          <h3 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] text-[#1d1d1f] leading-[1.02]">
            Você vê a fila. Sempre.
          </h3>
        </motion.div>
      </div>
    </section>
  );
}

function ScrollScale({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.94, 1, 1.03]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.4, 1, 1, 0.7],
  );
  if (reduceMotion) {
    return (
      <div ref={ref} className={className} style={{ position: "relative" }}>
        {children}
      </div>
    );
  }
  return (
    <motion.div
      ref={ref}
      style={{ scale, opacity, position: "relative" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Glass navbar that fades in on scroll, Apple.com style. */
function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav
      className={`nav-glass fixed top-0 inset-x-0 z-50 ${
        scrolled ? "is-scrolled" : ""
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-12 flex items-center justify-between">
        <Link
          href="/"
          className="text-[15px] font-medium tracking-tight text-[#1d1d1f]"
        >
          Suporte TI
        </Link>
        <div className="flex items-center gap-7">
          <Link
            href="/fila"
            className="text-[13px] tracking-tight text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors"
          >
            Fila
          </Link>
          <Link
            href="/anydesk"
            className="text-[13px] tracking-tight text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors"
          >
            AnyDesk
          </Link>
          <Link
            href="/novo-chamado"
            className="text-[13px] tracking-tight text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors"
          >
            Abrir chamado
          </Link>
          <ThemeToggle className="-mr-1" />
        </div>
      </div>
    </nav>
  );
}

/** Tracking input — primary CTA. Number → button → /fila with highlight. */
function TrackingInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, navigate] = useLocation();

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    const cleaned = value.replace(/\D+/g, "");
    if (!cleaned) {
      setError("Digite o número do seu chamado.");
      return;
    }
    const id = Number(cleaned);
    if (!Number.isFinite(id) || id <= 0) {
      setError("Número inválido.");
      return;
    }
    try {
      window.localStorage.setItem("helpdesk_my_ticket", String(id));
    } catch {
      /* noop */
    }
    navigate("/fila");
  }

  return (
    <form onSubmit={submit} className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.9, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
        whileHover={{ scale: 1.01 }}
        className="flex items-stretch gap-2 p-2 rounded-[20px] bg-white/70 backdrop-blur-2xl border border-black/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_30px_80px_rgba(0,113,227,0.15),0_4px_8px_rgba(0,0,0,0.05)]"
      >
        <div className="pl-5 flex items-center text-[#86868b]">
          <Search className="w-5 h-5" />
        </div>
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder="Número do seu chamado"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          className="flex-1 bg-transparent border-0 outline-none text-lg md:text-xl text-[#1d1d1f] placeholder:text-[#86868b] font-mono tracking-wider py-2"
        />
        <button
          type="submit"
          className="btn-pill btn-pill-primary text-[15px] px-6 py-3"
          style={{ borderRadius: 16 }}
        >
          Acompanhar
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
      <div className="mt-4 h-5 text-center text-[13px]">
        {error ? (
          <span className="text-red-600">{error}</span>
        ) : (
          <span className="text-[#86868b]">
            Já tem chamado aberto? Veja sua posição na fila.
          </span>
        )}
      </div>
    </form>
  );
}

export function Landing() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen text-[#1d1d1f] selection:bg-[#0071E3]/15 overflow-x-hidden font-sans">
      <GlassNav />

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 overflow-hidden bg-hero-glow">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <RiseLines
            immediate
            lines={["Travou?", "Me avisa."]}
            className="text-6xl md:text-8xl lg:text-[8rem] font-semibold tracking-[-0.04em] leading-[0.95] mb-6 text-[#1d1d1f]"
          />

          <RiseFade immediate delay={0.4}>
            <p className="text-lg md:text-2xl text-[#6e6e73] max-w-2xl mx-auto font-normal mb-12 tracking-tight">
              Computador, impressora, internet, sistema. Qualquer coisa que
              parar, abre um chamado aqui que eu resolvo.
            </p>
          </RiseFade>

          <RiseFade immediate delay={0.6}>
            <TrackingInput />
          </RiseFade>

          <RiseFade immediate delay={0.8}>
            <div className="mt-8 flex items-center justify-center gap-3 text-[14px]">
              <Link
                href="/novo-chamado"
                className="text-[#0071E3] hover:underline inline-flex items-center gap-1"
              >
                Abrir um novo chamado
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[#d2d2d7]">·</span>
              <Link
                href="/anydesk"
                className="text-[#0071E3] hover:underline inline-flex items-center gap-1"
              >
                Como instalar o AnyDesk
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </RiseFade>
        </div>
      </section>

      {/* Cinematic scroll showcase */}
      <CinematicShowcase />

      {/* Ticket flow — Apple-style storytelling */}
      <TicketFlowSection />

      {/* Closing drifting phrase */}
      <WordsShowcase />

      {/* How it works */}
      <section className="py-28 md:py-40 px-6 md:px-12 bg-apple-gray">
        <div className="max-w-6xl mx-auto">
          <ScrollScale className="mb-20 text-center">
            <RiseLines
              lines={["Simples assim.", "Sem rodeio."]}
              className="text-4xl md:text-6xl font-semibold tracking-[-0.035em] text-[#1d1d1f]"
            />
          </ScrollScale>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                num: "01",
                title: "Você abre",
                body: "Conta o que aconteceu em poucas palavras. Sem formulário gigante.",
                icon: Clock,
              },
              {
                num: "02",
                title: "Eu olho",
                body: "Recebo na hora e já começo a investigar o problema.",
                icon: PlayCircle,
              },
              {
                num: "03",
                title: "Resolvo",
                body: "Te aviso assim que estiver tudo certo. Você acompanha aqui.",
                icon: CheckCircle2,
              },
            ].map((s, i) => (
              <RiseFade key={s.num} delay={i * 0.1} y={30}>
                <div className="card-soft rounded-[20px] p-8 h-full">
                  <div className="text-[13px] font-mono tracking-widest text-[#0071E3] mb-6">
                    {s.num}
                  </div>
                  <s.icon className="w-7 h-7 text-[#1d1d1f] mb-5" />
                  <h3 className="text-2xl font-semibold tracking-tight mb-2 text-[#1d1d1f]">
                    {s.title}
                  </h3>
                  <p className="text-[#6e6e73] leading-relaxed text-[16px]">
                    {s.body}
                  </p>
                </div>
              </RiseFade>
            ))}
          </div>
        </div>
      </section>

      {/* What I solve */}
      <section className="py-28 md:py-40 px-6 md:px-12">
        <div className="max-w-6xl mx-auto">
          <ScrollScale className="text-center mb-16 md:mb-20">
            <RiseLines
              lines={["O que eu resolvo", "aqui pra você."]}
              className="text-4xl md:text-6xl font-semibold tracking-[-0.035em] mb-6 text-[#1d1d1f]"
            />
            <RiseFade delay={0.3}>
              <p className="text-lg md:text-xl text-[#6e6e73] font-normal max-w-2xl mx-auto">
                Se for de TI, pode mandar. Não tem problema pequeno demais.
              </p>
            </RiseFade>
          </ScrollScale>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Computador e impressora",
                desc: "Travou, não liga, não imprime, está lento. Eu vejo o que é e arrumo.",
                icon: Monitor,
              },
              {
                title: "Sistema e programas",
                desc: "Erro estranho, login que não funciona, programa que não abre. Me chama.",
                icon: Lock,
              },
              {
                title: "Internet e rede",
                desc: "Wi-Fi caiu, e-mail não envia, VPN não conecta. A gente resolve.",
                icon: Wifi,
              },
            ].map((card, i) => (
              <RiseFade key={card.title} delay={i * 0.1} y={30}>
                <div className="card-soft rounded-[20px] p-8 h-full bg-apple-gray border-transparent">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6 text-[#0071E3]">
                    <card.icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight mb-2 text-[#1d1d1f]">
                    {card.title}
                  </h3>
                  <p className="text-[#6e6e73] leading-relaxed text-[15px]">
                    {card.desc}
                  </p>
                </div>
              </RiseFade>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="py-28 md:py-40 px-6 md:px-12 bg-apple-gray">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollScale>
            <RiseLines
              lines={["Aconteceu algo?", "Manda aqui."]}
              className="text-4xl md:text-7xl font-semibold tracking-[-0.04em] mb-6 leading-[0.98] text-[#1d1d1f]"
            />
          </ScrollScale>
          <RiseFade delay={0.3}>
            <p className="text-lg md:text-xl text-[#6e6e73] font-normal mb-10">
              Quanto antes você abrir, antes resolvo.
            </p>
          </RiseFade>

          <RiseFade delay={0.5}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/novo-chamado">
                <button className="btn-pill btn-pill-primary text-[17px] px-7 py-3.5">
                  Abrir chamado
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/fila">
                <button className="btn-pill btn-pill-secondary text-[17px] px-7 py-3.5">
                  Ver a fila
                </button>
              </Link>
            </div>
          </RiseFade>
        </div>
      </section>

      <footer className="py-10 px-6 md:px-12 border-t border-black/[0.06] text-center text-[#86868b] text-[12px]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div>Central de Suporte TI · uso interno</div>
          <div>{new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
