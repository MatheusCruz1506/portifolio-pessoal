import { Link } from "react-router";

export function SeeProjects() {
  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Link
      to="/all-projects"
      onClick={handleClick}
      className="hover:opacity-75 rounded-[6px] text-[16px] bg-gradient-x py-[18px] px-[74px]"
    >
      SEE ALL PROJECTS
    </Link>
  );
}
