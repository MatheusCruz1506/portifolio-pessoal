import { Link } from "react-router";

export function Obrigado() {
  return (
    <div className="bg-background min-h-screen flex items-center justify-center">
      <div className="justify-center flex flex-col gap-4 ">
        <h1 className="text-text-p font-bold text-6xl">OBRIGADO!</h1>
        <Link
          className="mx-auto hover:opacity-75 text-[16px] bg-gradient-x text-text-btn rounded-[6px] py-2 px-3"
          to="/"
        >
          Voltar
        </Link>
      </div>
    </div>
  );
}
