export function AboutMe() {
  return (
    <div className="self-start flex gap-[18px] flex-col mb-[130px] max-lg:mb-[72px]">
      <h2 className="ml-[22px] text-[24px] font-semibold text-text-p">
        About me
      </h2>

      <div className="flex gap-[16px] ">
        <span className="mt-[8px] bg-gradient-y min-w-[5px] h-[116px] rounded-[2px] " />
        <p className=" leading-[26px] max-w-[842px] text-[18px] text-text-p">
          Olá, eu sou Matheus Cruz — um entusiasta do desenvolvimento front-end
          que adora dar vida a ideias através de código limpo e design bem
          pensado. Atualmente estudo Análise e Desenvolvimento de Sistemas e
          venho me especializando em React.js, Tailwind CSS e JavaScript ES6+,
          criando projetos que unem estética, usabilidade e performance. Tenho
          interesse por UI/UX e acessibilidade, sempre buscando que cada detalhe
          da interface ofereça uma boa experiência para todos. Meu foco é
          evoluir constantemente, colaborar com outros desenvolvedores e
          construir aplicações que causem impacto real — tanto visual quanto
          funcional.
        </p>
      </div>
    </div>
  );
}
