'use client';

export function Footer() {
  return (
    <footer className="w-full mt-20 border-t border-white/5 bg-black/20 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-6 py-8 md:py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-tr from-[#00fe9b] to-[#00a852] text-black shadow-[0_0_10px_rgba(0,254,155,0.3)]">
              <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l3.593-1.632A11.962 11.962 0 0012 19c1.66 0 3.238-.34 4.678-1.004L20 21l-.813-5.096A11.97 11.97 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12c0 1.439.32 2.798.887 4.016z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 0v4m0-4h-2m2 0h2" />
              </svg>
            </div>
            <span className="text-sm font-bold text-white tracking-wide select-none">
              RespondiA <span className="text-[#00fe9b]">Games</span>
            </span>
          </div>
          <div className="text-xs text-gray-500 font-light select-none">
            © {new Date().getFullYear()} RespondiA. Todos os direitos reservados.
          </div>
        </div>
        
        <div className="max-w-4xl">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 select-none">
            Isenção de Responsabilidade
          </h4>
          <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed font-light">
            O <strong className="text-gray-400 font-medium">RespondiA Games</strong> opera exclusivamente como um indexador automático de metadados e links magnéticos de torrents públicos disponíveis livremente na internet. Nós <strong className="text-[#00fe9b]/70 font-medium">não hospedamos</strong>, armazenamos, transmitimos ou distribuímos qualquer tipo de jogo, arquivo executável, mídia ou material protegido por direitos autorais em nossos servidores. A facilitação de busca não implica em endosso e não nos responsabilizamos pela legitimidade, integridade ou uso de qualquer arquivo obtido por meio destes links. O download e a utilização dos torrents são de inteira responsabilidade do usuário final.
          </p>
        </div>
      </div>
    </footer>
  );
}
