import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, key } = useLocation();  // <-- use key too

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "instant" // "smooth" if you want animation
    });
  }, [pathname, key]); // <-- include key

  return null;
}
