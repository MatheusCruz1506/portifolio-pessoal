import { Link } from "react-router";

export function Footer() {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="h-[200px] mb-[72px] flex flex-col items-center gap-[48px]">
      <div className="flex gap-[72px]">
        <a
          target="_blank"
          href="https://www.linkedin.com/in/matheus-cruz-a426a821b/"
        >
          <div className="flex flex-col items-center gap-[10px]">
            <img src="/linkedin-icon.svg" alt="Icone gmail" />
            <h4 className="text-[12px] leading-[12px] text-text-p">LINKEDIN</h4>
          </div>
        </a>
        <a target="_blank" href="https://github.com/MatheusCruz1506">
          <div className="flex flex-col items-center gap-[10px]">
            <img src="/github-icon.svg" alt="Icone gmail" />
            <h4 className="text-[12px] leading-[12px] text-text-p">GITHUB</h4>
          </div>
        </a>
      </div>
      <div className="flex gap-[48px]">
        <Link
          onClick={handleClick}
          to="/all-projects"
          className="text-text-p text-[14px]"
          href=""
        >
          Projects
        </Link>
        <Link
          onClick={handleClick}
          to="/contact"
          className="text-text-p text-[14px]"
          href=""
        >
          Contact
        </Link>
      </div>
      <h4 className="text-[14px] leading-[26px]  text-text-p">
        MATHEUS CRUZ 2025
      </h4>
    </div>
  );
}
