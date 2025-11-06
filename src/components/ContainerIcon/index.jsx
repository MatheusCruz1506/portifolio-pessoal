export function ContainerIcon({ children, name }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-full flex">{children}</div>
      <h3 className="text-text-p text-[16px] max-lg:text-[12px] mt-[20px]">{name}</h3>
    </div>
  );
}
