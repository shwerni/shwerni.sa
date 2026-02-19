// hooks/useScrollToTop.ts
export function useScrollToTop() {
  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return scrollToTop;
}
