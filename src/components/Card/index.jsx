export function Card({ children, description, image, title, url }) {
  return (
    <div className=" gap-[16px] items-center max-w-[522px] min-h-[636px] bg-bg-card overflow-hidden rounded-[6px]">
      <img
        src={image}
        alt="Imagem do card"
        className="w-full h-[376px] max-lg:h-[324 px] object-cover"
      />
      <div className="flex flex-col gap-[16px] p-4">
        <div className=" flex-col flex gap-[12px]">
          <h2 className="m-0 text-[20px] font-semibold text-text-p">{title}</h2>

          <div className="flex gap-[12px]">{children}</div>

          <p className="text-[16px] leading-[24px] text-text-p ">
            {description}
          </p>
        </div>
        <a
          target="_blank"
          href={url}
          className="flex gap-1 self-center hover:opacity-75 bg-gradient-x text-text-btn rounded-[6px] py-[8px] px-[18px]"
        >
          VISITE
          <img
            src="/arrow-up-right.svg"
            alt="icone de seta de visa ao projeto"
          />
        </a>
      </div>
    </div>
  );
}
