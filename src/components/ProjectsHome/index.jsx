export function ProjectsHome({ children }) {
  return (
    <section className="flex flex-col gap-[32px] ">
      <h2 className="text-text-p font-semibold text-[24px] leading-[26px]">
        Projects
      </h2>
      <div className="flex gap-[28px] max-lg:flex-col">{children}</div>
    </section>
  );
}
