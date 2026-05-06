import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
import { Monitor, Shield, Zap, Clock, Wifi, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-glow.png";
import speedImage from "@/assets/speed-abstract.png";
import ecosystemImage from "@/assets/ecosystem-abstract.png";

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

export function Landing() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const heroY = useTransform(smoothProgress, [0, 0.2], [0, 200]);
  const heroOpacity = useTransform(smoothProgress, [0, 0.15], [1, 0]);
  const scaleImage = useTransform(smoothProgress, [0, 0.2], [1, 1.1]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-x-hidden font-sans">
      {/* Navigation Bar (Minimal) */}
      <nav className="fixed top-0 w-full z-50 mix-blend-difference px-6 py-6 md:px-12 flex justify-between items-center pointer-events-none">
        <div className="font-semibold text-lg tracking-tight">Central de Suporte TI</div>
        <div className="flex items-center gap-6">
          <Link href="/anydesk" className="pointer-events-auto text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity">
            AnyDesk
          </Link>
          <Link href="/admin" className="pointer-events-auto text-sm tracking-tight opacity-70 hover:opacity-100 transition-opacity">
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

        <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl md:text-8xl lg:text-[9rem] font-bold tracking-tighter leading-[0.85] mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
          >
            Travou? <br/> Me avisa.
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl md:text-3xl text-slate-400 max-w-2xl font-light mb-12 tracking-tight"
          >
            Computador, impressora, internet, sistema. Qualquer coisa que parar, me chama aqui que eu resolvo.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="/novo-chamado">
              <Button size="lg" className="h-16 px-10 text-xl rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                Tenho um problema
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Section 2: How it works */}
      <section className="py-32 md:py-48 px-6 md:px-12 relative">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-24 text-center text-slate-100">
              Simples assim. <br/> <span className="text-slate-500">Sem rodeio.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
            {[
              { num: "01", label: "Você abre um chamado contando o que aconteceu" },
              { num: "02", label: "Eu recebo na hora e já começo a olhar" },
              { num: "03", label: "Resolvo e te aviso assim que estiver pronto" }
            ].map((stat, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="flex flex-col items-center">
                  <div className="text-6xl md:text-8xl font-medium tracking-tighter text-blue-500 mb-4">
                    {stat.num}
                  </div>
                  <div className="text-lg md:text-xl text-slate-400 font-light max-w-[220px]">
                    {stat.label}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Visual Showcase with Image */}
      <section className="py-32 px-6 md:px-12 bg-slate-900/50">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="lg:w-1/2">
            <FadeIn>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">
                Sem dor de cabeça. <br/> Pode deixar comigo.
              </h2>
              <p className="text-xl text-slate-400 font-light leading-relaxed mb-8">
                Você não precisa entender o problema, só descrever o que está acontecendo. Eu cuido do resto e te mantenho informado até voltar a funcionar.
              </p>
              <ul className="space-y-6">
                {[
                  { icon: Zap, text: "Atendimento na ordem que chega" },
                  { icon: Shield, text: "Você acompanha o status do chamado" },
                  { icon: Wifi, text: "Aviso assim que terminar" }
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-lg text-slate-300">
                    <div className="p-2 bg-blue-500/10 rounded-full text-blue-400">
                      <item.icon size={24} />
                    </div>
                    {item.text}
                  </li>
                ))}
              </ul>
            </FadeIn>
          </div>
          <div className="lg:w-1/2 w-full">
            <FadeIn delay={0.2}>
              <div className="rounded-3xl overflow-hidden relative aspect-square shadow-[0_0_60px_rgba(59,130,246,0.1)] border border-slate-800">
                <img src={speedImage} alt="Speed abstract" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-transparent opacity-60" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section 4: The Ecosystem Grid */}
      <section className="py-32 md:py-48 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <FadeIn>
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-7xl font-bold tracking-tighter mb-6">
                O que eu resolvo <br/> aqui pra você.
              </h2>
              <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto">
                Se for de TI, pode mandar. Não tem problema pequeno demais.
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Computador e impressora", desc: "Travou, não liga, não imprime, está lento. Eu vejo o que é e arrumo.", icon: Monitor },
              { title: "Sistema e programas", desc: "Erro estranho, login que não funciona, programa que não abre. Me chama.", icon: Lock },
              { title: "Internet e rede", desc: "Wi-Fi caiu, e-mail não envia, VPN não conecta. A gente resolve.", icon: Wifi }
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-10 h-full flex flex-col hover:bg-slate-900/80 transition-colors duration-500 group">
                  <card.icon className="w-12 h-12 text-blue-500 mb-8 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                  <h3 className="text-2xl font-medium tracking-tight mb-4">{card.title}</h3>
                  <p className="text-slate-400 font-light leading-relaxed">{card.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Image Showcase 2 */}
      <section className="py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto relative rounded-[3rem] overflow-hidden aspect-[21/9] md:aspect-[3/1] border border-slate-800/50 shadow-2xl flex items-center justify-center">
          <img src={ecosystemImage} alt="Ecosystem" className="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent" />
          
          <div className="relative z-10 text-center px-4">
            <FadeIn>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tighter text-white mb-4">
                Você fica sabendo de tudo.
              </h2>
              <p className="text-lg md:text-xl text-slate-300 font-light max-w-2xl mx-auto">
                Acompanha aqui o que está pendente, o que estou olhando agora e o que já resolvi.
              </p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Section 6: Closing Hero */}
      <section className="py-48 px-6 md:px-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-950/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center flex flex-col items-center">
          <FadeIn>
            <Clock className="w-16 h-16 text-blue-500 mx-auto mb-8" />
            <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-tight">
              Aconteceu algo? <br/> Manda aqui.
            </h2>
            <p className="text-xl md:text-2xl text-slate-400 font-light mb-12">
              Já estou de olho. Quanto antes você abrir, antes resolvo.
            </p>
            
            <Link href="/novo-chamado">
              <Button size="lg" className="h-16 px-12 text-xl rounded-full bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Tenho um problema
              </Button>
            </Link>
          </FadeIn>
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
