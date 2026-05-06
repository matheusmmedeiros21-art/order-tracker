import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Download, Monitor, ArrowRight, ArrowLeft, Apple, Check, Copy } from "lucide-react";

function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`nav-glass fixed top-0 inset-x-0 z-50 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 h-12 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-1.5 text-[13px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Link>
        <Link href="/" className="text-[15px] font-medium tracking-tight text-[#1d1d1f]">
          Suporte TI
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/fila" className="text-[13px] text-[#1d1d1f]/80 hover:text-[#1d1d1f] transition-colors">
            Fila
          </Link>
          <Link href="/novo-chamado" className="text-[13px] text-[#0071E3] hover:underline">
            Abrir chamado
          </Link>
        </div>
      </div>
    </nav>
  );
}

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
};

const downloads = [
  {
    os: "Windows",
    icon: <Monitor className="w-5 h-5" />,
    href: "https://download.anydesk.com/AnyDesk.exe",
    label: "Baixar para Windows",
  },
  {
    os: "macOS",
    icon: <Apple className="w-5 h-5" />,
    href: "https://download.anydesk.com/anydesk.dmg",
    label: "Baixar para Mac",
  },
];

const steps = [
  {
    n: "01",
    title: "Baixe o AnyDesk",
    body: "Escolha a versão do seu sistema (Windows ou Mac) e clique para baixar. O arquivo é leve e a instalação é rápida.",
  },
  {
    n: "02",
    title: "Abra o programa",
    body: "Depois de baixar, é só clicar duas vezes no arquivo. Não precisa instalar nada complicado, ele já abre pronto pra usar.",
  },
  {
    n: "03",
    title: "Copie o seu endereço",
    body: "Na tela inicial do AnyDesk vai aparecer um número grande, do tipo 123 456 789. Esse é o seu endereço, é só copiar.",
  },
  {
    n: "04",
    title: "Cole no chamado",
    body: "Quando você abrir um chamado aqui no site, cola esse número no campo do AnyDesk. Pronto, eu consigo acessar seu computador remotamente.",
  },
];

export function AnydeskGuide() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [copied, setCopied] = useState(false);
  function copyExample() {
    navigator.clipboard.writeText("123 456 789").catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="min-h-screen text-[#1d1d1f] selection:bg-[#0071E3]/15 overflow-x-hidden font-sans">
      <GlassNav />

      {/* Hero */}
      <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12 overflow-hidden bg-hero-glow">
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-black/[0.06] text-[11px] uppercase tracking-widest text-[#0071E3] mb-8 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            Guia rápido
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[7rem] font-semibold tracking-[-0.04em] leading-[0.95] mb-6 text-[#1d1d1f]"
          >
            Instale o AnyDesk. <br />
            <span className="text-[#86868b]">É rápido.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-2xl text-[#6e6e73] max-w-2xl mx-auto font-normal tracking-tight"
          >
            Com o AnyDesk eu consigo acessar seu computador de longe e resolver o problema sem você sair da cadeira.
          </motion.p>
        </div>
      </section>

      {/* Download cards */}
      <section className="px-6 md:px-12 pb-24">
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
          {downloads.map((d, i) => (
            <FadeIn key={d.os} delay={i * 0.1}>
              <a
                href={d.href}
                target="_blank"
                rel="noreferrer noopener"
                className="card-soft block p-7 rounded-[20px] group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-11 h-11 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center group-hover:scale-110 transition-transform">
                    {d.icon}
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#86868b] group-hover:text-[#0071E3] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="text-[11px] uppercase tracking-widest text-[#86868b] mb-1.5">{d.os}</div>
                <div className="text-xl font-semibold tracking-tight text-[#1d1d1f]">{d.label}</div>
              </a>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="py-24 md:py-32 px-6 md:px-12 bg-apple-gray">
        <div className="max-w-5xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.035em] mb-16 text-center text-[#1d1d1f]">
              Em 4 passos. <br />
              <span className="text-[#86868b]">Sem mistério.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.08}>
                <div className="card-soft h-full p-8 rounded-[20px]">
                  <div className="text-[13px] font-mono tracking-widest text-[#0071E3] mb-5">{s.n}</div>
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-2 text-[#1d1d1f]">{s.title}</h3>
                  <p className="text-[#6e6e73] leading-relaxed text-[15px]">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Address example */}
      <section className="py-24 md:py-32 px-6 md:px-12">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-5xl font-semibold tracking-[-0.035em] mb-4 text-[#1d1d1f]">
              É assim que o endereço aparece.
            </h2>
            <p className="text-lg text-[#6e6e73] mb-10 font-normal max-w-xl mx-auto">
              Um número de 9 dígitos, separado em três blocos. É esse que você cola no chamado.
            </p>

            <button
              onClick={copyExample}
              className="card-soft group inline-flex items-center gap-5 px-8 py-6 rounded-[22px]"
            >
              <div className="text-3xl md:text-5xl font-mono font-medium tracking-tight text-[#1d1d1f]">
                123 456 789
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3] group-hover:bg-[#0071E3]/15 transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </div>
            </button>
            <p className="text-[12px] text-[#86868b] mt-3 tracking-wide">
              {copied ? "Exemplo copiado" : "Clique para copiar o exemplo"}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 md:py-40 px-6 md:px-12 bg-apple-gray">
        <div className="max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-semibold tracking-[-0.04em] mb-8 leading-[0.98] text-[#1d1d1f]">
              Tudo certo? <br />
              Bora abrir o chamado.
            </h2>
            <Link href="/novo-chamado">
              <button className="btn-pill btn-pill-primary text-[17px] px-7 py-3.5">
                Abrir chamado
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </FadeIn>
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
