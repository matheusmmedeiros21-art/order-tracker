import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  useReducedMotion,
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
} from "lucide-react";

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
    <form onSubmit={submit} className="w-full max-w-xl mx-auto">
      <div className="flex items-stretch gap-2 p-1.5 rounded-[18px] bg-white/80 backdrop-blur-xl border border-black/[0.08] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
        <div className="pl-4 flex items-center text-[#86868b]">
          <Search className="w-4 h-4" />
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
          className="flex-1 bg-transparent border-0 outline-none text-base md:text-[17px] text-[#1d1d1f] placeholder:text-[#86868b] font-mono tracking-wider"
        />
        <button
          type="submit"
          className="btn-pill btn-pill-primary text-[15px] px-5 py-2.5"
          style={{ borderRadius: 14 }}
        >
          Acompanhar
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 h-5 text-center text-[13px]">
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
    <div className="relative min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071E3]/15 overflow-x-hidden font-sans">
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
