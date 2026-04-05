export function AllProjects({children}) {
return(
   <section className="flex flex-col gap-[32px]">
      <h2 className="text-text-p font-semibold text-[24px] leading-[26px]">Projects</h2>
      <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-x-[28px] gap-y-[48px]">{children}</div>
    </section>
)
}