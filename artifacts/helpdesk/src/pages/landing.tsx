import { useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { Monitor, Shield, Zap, Clock, Wifi, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-glow.png";
import speedImage from "@/assets/speed-abstract.png";
import ecosystemImage from "@/assets/ecosystem-abstract.png";

/**
 * RiseLines — Apple-style "letters rise from below" reveal.
 * Each line is wrapped in an overflow-hidden mask. As it scrolls into view,
 * the inner span translates from y:110% to 0 with a long ease.
 * Use lines={["primeira linha", "segunda linha"]} so we can animate per line.
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

/** Body paragraph fade-in from below, slightly delayed */
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

/** Headline that scales up slightly while scrolling through it (Apple "scroll zoom") */
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
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.92, 1, 1.04]);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.4, 1, 1, 0.6],
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

export function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: containerRef });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const heroY = useTransform(smoothProgress, [0, 0.2], [0, reduceMotion ? 0 : 200]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, reduceMotion ? 1 : 0]);
  const scaleImage = useTransform(smoothProgress, [0, 0.2], [1, reduceMotion ? 1 : 1.1]);

  // Hero text parallax — text moves slower than background, lifts on scroll.
  const heroTextY = useTransform(scrollYProgress, [0, 0.25], [0, reduceMotion ? 0 : -120]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans"
    >
      {/* Navigation Bar (Minimal) */}
      <nav className="fixed top-0 w-full z-50 mix-blend-difference px-6 py-6 md:px-12 flex justify-between items-center pointer-events-none">
        <div className="font-semibold text-lg tracking-tight">
          Central de Suporte TI
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/fila"
            className="pointer-events-auto text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity"
          >
            Fila
          </Link>
          <Link
            href="/anydesk"
            className="pointer-events-auto text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity"
          >
            AnyDesk
          </Link>
          <Link
            href="/admin"
            className="pointer-events-auto text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity"
          >
            Admin
          </Link>
        </div>
      </nav>

      {/* Section 1: Hero */}
      <section className="relative h-[100svh] flex flex-col items-center justify-center overflow-hidden">
        <motion.div
          className="absolute inset-0 z-0"
          style={{ y: heroY, opacity: heroOpacity, scale: scaleImage }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#020617]/50 to-[#020617] z-10" />
          <img
            src={heroImage}
            alt="Abstract glowing network"
            className="w-full h-full object-cover object-center opacity-60"
          />
        </motion.div>

        <motion.div
          style={{ y: heroTextY }}
          className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-20"
        >
          <RiseLines
            immediate
            lines={["Travou?", "Me avisa."]}
            className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter leading-[0.9] mb-6"
            lineClassName="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          />

          <RiseFade immediate delay={0.45}>
            <p className="text-xl md:text-3xl text-slate-400 max-w-2xl font-light mb-12 tracking-tight">
              Computador, impressora, internet, sistema. Qualquer coisa que
              parar, me chama aqui que eu resolvo.
            </p>
          </RiseFade>

          <RiseFade immediate delay={0.65}>
            <Link href="/novo-chamado">
              <Button
                size="lg"
                className="h-16 px-10 text-xl rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]"
              >
                Tenho um problema
              </Button>
            </Link>
          </RiseFade>
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 text-xs tracking-[0.3em] uppercase flex flex-col items-center gap-3"
        >
          <span>Role pra ver</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-8 bg-gradient-to-b from-slate-500 to-transparent"
          />
        </motion.div>
      </section>

      {/* Section 2: How it works */}
      <section className="py-32 md:py-48 px-6 md:px-12 relative">
        <div className="max-w-6xl mx-auto">
          <ScrollScale className="mb-24 text-center">
            <RiseLines
              lines={["Simples assim.", "Sem rodeio."]}
              className="text-4xl md:text-7xl font-bold tracking-tighter text-slate-100"
              lineClassName=""
            />
          </ScrollScale>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
            {[
              { num: "01", label: "Você abre um chamado contando o que aconteceu" },
              { num: "02", label: "Eu recebo na hora e já começo a olhar" },
              { num: "03", label: "Resolvo e te aviso assim que estiver pronto" },
            ].map((stat, i) => (
              <RiseFade key={i} delay={i * 0.12} y={50}>
                <div className="flex flex-col items-center">
                  <div className="text-6xl md:text-8xl font-medium tracking-tighter text-blue-500 mb-4">
                    {stat.num}
                  </div>
                  <div className="text-lg md:text-xl text-slate-400 font-light max-w-[220px]">
                    {stat.label}
                  </div>
                </div>
              </RiseFade>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Visual Showcase with Image */}
      <section className="py-32 px-6 md:px-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <RiseLines
              lines={["Sem dor de cabeça.", "Pode deixar comigo."]}
              className="text-4xl md:text-6xl font-bold tracking-tighter mb-8"
            />
            <RiseFade delay={0.3}>
              <p className="text-xl text-slate-400 font-light leading-relaxed mb-8">
                Você não precisa entender o problema, só descrever o que está
                acontecendo. Eu cuido do resto e te mantenho informado até
                voltar a funcionar.
              </p>
            </RiseFade>
            <RiseFade delay={0.45}>
              <ul className="space-y-6">
                {[
                  { icon: Zap, text: "Atendimento na ordem que chega" },
                  { icon: Shield, text: "Você acompanha o status do chamado" },
                  { icon: Wifi, text: "Aviso assim que terminar" },
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-4 text-lg text-slate-300"
                  >
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-400">
                      <item.icon size={24} />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </RiseFade>
          </div>
          <div className="lg:w-1/2 w-full">
            <RiseFade delay={0.2} y={60}>
              <ImageReveal>
                <div className="rounded-3xl overflow-hidden relative aspect-square shadow-[0_0_60px_rgba(59,130,246,0.1)] border border-slate-800">
                  <img
                    src={speedImage}
                    alt="Speed abstract"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-transparent opacity-60" />
                </div>
              </ImageReveal>
            </RiseFade>
          </div>
        </div>
      </section>

      {/* Section 4: The Ecosystem Grid */}
      <section className="py-32 md:py-48 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <ScrollScale className="text-center mb-24">
            <RiseLines
              lines={["O que eu resolvo", "aqui pra você."]}
              className="text-4xl md:text-7xl font-bold tracking-tighter mb-6"
            />
            <RiseFade delay={0.4}>
              <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                Se for de TI, pode mandar. Não tem problema pequeno demais.
              </p>
            </RiseFade>
          </ScrollScale>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <RiseFade key={i} delay={i * 0.12} y={40}>
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 h-full flex flex-col hover:bg-slate-900/80 hover:-translate-y-1 transition-all duration-500 group">
                  <card.icon className="w-12 h-12 text-blue-500 mb-8 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="text-2xl font-medium tracking-tight mb-4">
                    {card.title}
                  </h3>
                  <p className="text-slate-400 font-light leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </RiseFade>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Image Showcase 2 */}
      <section className="py-24 px-6 md:px-12">
        <RiseFade y={80}>
          <div className="max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden aspect-[21/9] md:aspect-[3/1] border border-slate-800/50 shadow-2xl flex items-center justify-center">
            <ParallaxImage src={ecosystemImage} alt="Ecosystem" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />

            <div className="relative z-10 text-center px-4">
              <RiseLines
                lines={["Você fica sabendo", "de tudo."]}
                className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-4"
              />
              <RiseFade delay={0.4}>
                <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto">
                  Acompanha aqui o que está pendente, o que estou olhando agora
                  e o que já resolvi.
                </p>
              </RiseFade>
            </div>
          </div>
        </RiseFade>
      </section>

      {/* Section 6: Closing Hero */}
      <section className="py-48 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-950/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <RiseFade>
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-8" />
          </RiseFade>
          <ScrollScale>
            <RiseLines
              lines={["Aconteceu algo?", "Manda aqui."]}
              className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]"
            />
          </ScrollScale>
          <RiseFade delay={0.4}>
            <p className="text-xl md:text-2xl text-slate-400 font-light mb-12">
              Já estou de olho. Quanto antes você abrir, antes resolvo.
            </p>
          </RiseFade>

          <RiseFade delay={0.55}>
            <Link href="/novo-chamado">
              <Button
                size="lg"
                className="h-16 px-12 text-xl rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Tenho um problema
              </Button>
            </Link>
          </RiseFade>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 md:px-12 border-t border-slate-800/50 text-center text-slate-500 text-sm font-light">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>Central de Suporte TI &middot; uso interno</div>
          <div>{new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}

/** ImageReveal — clip-path mask sweeps up to reveal the image (Apple-style) */
function ImageReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });
  return (
    <motion.div
      ref={ref}
      initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
      animate={
        inView
          ? { clipPath: "inset(0% 0% 0% 0%)" }
          : { clipPath: "inset(100% 0% 0% 0%)" }
      }
      transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

/** ParallaxImage — gentle parallax inside a section */
function ParallaxImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLImageElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [1.1, 1.2]);
  return (
    <motion.img
      ref={ref}
      src={src}
      alt={alt}
      style={{ y, scale }}
      className="absolute inset-0 w-full h-full object-cover opacity-50"
    />
  );
}
