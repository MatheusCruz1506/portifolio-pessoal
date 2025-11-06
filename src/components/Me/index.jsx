import { Link } from "react-router";
import { Typography } from "../Typography";

export function Me() {
  return (
    <>
      <section className="w-full mb-[260px] max-lg:mb-[72px] flex flex-col">
        <div className="flex items-center justify-between max-lg:flex-col-reverse ">
          <div className="flex flex-col gap-[30px] max-lg:text-center ">
            <Typography />
            <Link
              to="/contact"
              className="transition-colors hover:opacity-75 mr-auto text-[16px] max-lg:mx-auto  bg-gradient-x text-text-btn rounded-[6px] py-[12px] px-[20px]"
            >
              Contact me
            </Link>
          </div>
          <div>
            <img src="/perfil.svg" alt="Foto de perfil" />
          </div>
        </div>
        <img
          src="/arrow-scroll.svg"
          alt=""
          className="self-center max-md:hidden"
        />
      </section>
    </>
  );
}
