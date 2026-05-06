import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView } from "framer-motion";
import { Download, Monitor, ArrowRight, ArrowLeft, Apple, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
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
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-center backdrop-blur-md bg-[#020617]/60 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Link>
        <div className="font-semibold text-lg tracking-tight">Central de Suporte TI</div>
        <Link href="/novo-chamado" className="text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity">
          Abrir chamado
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-40 pb-32 px-6 md:px-12 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[700px] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-widest text-slate-400 mb-8"
          >
            <Download className="w-3.5 h-3.5" />
            Guia rápido
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-7xl lg:text-[7.5rem] font-bold tracking-tighter leading-[0.9] mb-8 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          >
            Instale o AnyDesk. <br />
            <span className="text-slate-500">É rápido.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg md:text-2xl text-slate-400 max-w-2xl mx-auto font-light tracking-tight"
          >
            Com o AnyDesk eu consigo acessar seu computador de longe e resolver o problema sem você sair da cadeira.
          </motion.p>
        </div>
      </section>

      {/* Download cards */}
      <section className="px-6 md:px-12 pb-32">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {downloads.map((d, i) => (
            <FadeIn key={d.os} delay={i * 0.1}>
              <a
                href={d.href}
                target="_blank"
                rel="noreferrer noopener"
                className="group block p-8 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 hover:border-blue-500/40 transition-all duration-500 hover:scale-[1.02]"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {d.icon}
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                <div className="text-sm uppercase tracking-widest text-slate-500 mb-2">{d.os}</div>
                <div className="text-2xl font-semibold tracking-tight">{d.label}</div>
              </a>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="py-32 px-6 md:px-12 bg-slate-900/40 border-y border-white/5">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-24 text-center">
              Em 4 passos. <br />
              <span className="text-slate-500">Sem mistério.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.08}>
                <div className="h-full p-10 rounded-3xl bg-gradient-to-br from-white/[0.04] to-transparent border border-white/10">
                  <div className="text-5xl font-medium tracking-tighter text-blue-500 mb-6">{s.n}</div>
                  <h3 className="text-2xl md:text-3xl font-semibold tracking-tight mb-4">{s.title}</h3>
                  <p className="text-slate-400 font-light leading-relaxed text-lg">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Address example */}
      <section className="py-32 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
              É assim que o endereço aparece.
            </h2>
            <p className="text-lg text-slate-400 mb-12 font-light max-w-xl mx-auto">
              Um número de 9 dígitos, separado em três blocos. É esse que você cola no chamado.
            </p>

            <button
              onClick={copyExample}
              className="group inline-flex items-center gap-4 px-10 py-8 rounded-3xl bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/30 hover:border-blue-500/60 transition-all"
            >
              <div className="text-4xl md:text-6xl font-mono font-medium tracking-tighter text-white">
                123 456 789
              </div>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-slate-300 group-hover:bg-white/10 transition-colors">
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </div>
            </button>
            <p className="text-xs text-slate-500 mt-4 tracking-wide">
              {copied ? "Exemplo copiado" : "Clique para copiar o exemplo"}
            </p>
          </FadeIn>
        </div>
      </section>

      {/* CTA */}
      <section className="py-40 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <FadeIn>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-8 leading-tight">
              Tudo certo? <br />
              Bora abrir o chamado.
            </h2>
            <Link href="/novo-chamado">
              <Button
                size="lg"
                className="h-16 px-12 text-xl rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Tenho um problema
              </Button>
            </Link>
          </FadeIn>
        </div>
      </section>

      <footer className="py-12 px-6 md:px-12 border-t border-slate-800/50 text-center text-slate-500 text-sm font-light">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>Central de Suporte TI &middot; uso interno</div>
          <div>{new Date().getFullYear()}</div>
        </div>
      </footer>
    </div>
  );
}
