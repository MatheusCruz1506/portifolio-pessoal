import { useEffect } from "react";
import { useLocation } from "react-router";

const ScrollToTop = ({ routes = [] }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    if (routes.length === 0 || routes.includes(pathname)) {
      window.scrollTo(0, 0);
    }
  }, [pathname, routes]);

  return null;
};

export default ScrollToTop;
