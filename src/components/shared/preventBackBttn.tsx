import { useEffect } from "react";

export default function usePreventBack(message: string) {
  useEffect(() => {
    window.history.pushState(null, "", window.location.pathname);

    const handlePopState = () => {
      alert(message);
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [message]);
}
