import { Link, NavLink } from "react-router";

export function NavBar() {
  return (
    <nav className="text-[16px] w-full">
      <div className="mx-auto max-w-[1080px]">
        <div className="flex items-center justify-between py-[28px] max-xl:px-[24px]">
          <NavLink to="/" className="text-text-p">
            {({ isActive }) => (
              <>
                Home
                {isActive && (
                  <div className="w-full h-[6px] bg-gradient-x rounded-[4px]"></div>
                )}
              </>
            )}
          </NavLink>
          <div className=" flex gap-[87px] max-sm:gap-[32px] items-center">
            <NavLink to="/all-projects" className="text-text-p">
              {({ isActive }) => (
                <>
                  Projects
                  {isActive && (
                    <div className="w-full h-[6px] bg-gradient-x rounded-[4px]"></div>
                  )}
                </>
              )}
            </NavLink>
            <Link
              to="/contact"
              className="hover:opacity-75 self-start bg-gradient-x text-text-btn rounded-[6px] py-[12px] px-[20px]"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
