import { useEffect, useRef } from "react";

function ScrollReveal({ as: Tag = "div", className = "", children, ...props }) {
    const elementRef = useRef(null);

    useEffect(() => {
        const element = elementRef.current;
        if (!element) return undefined;
        const revealIfVisible = () => {
            const bounds = element.getBoundingClientRect();
            if (bounds.top >= window.innerHeight || bounds.bottom <= 0) return;
            element.classList.add("is-visible");
            observer?.unobserve(element);
            window.removeEventListener("scroll", revealIfVisible);
        };
        const observer = "IntersectionObserver" in window
            ? new IntersectionObserver(([entry]) => { if (entry.isIntersecting) revealIfVisible(); }, { threshold: 0.01, rootMargin: "0px 0px -24px 0px" })
            : null;
        observer?.observe(element);
        window.addEventListener("scroll", revealIfVisible, { passive: true });
        revealIfVisible();
        return () => {
            observer?.disconnect();
            window.removeEventListener("scroll", revealIfVisible);
        };
    }, []);

    return <Tag ref={elementRef} className={`scroll-reveal ${className}`.trim()} {...props}>{children}</Tag>;
}

export default ScrollReveal;
