import { useEffect, useState } from "react";

/**
 * Custom hook to track scroll position
 * Returns true when user has scrolled past the threshold
 */
export function useScrollPosition(threshold: number = 100): boolean {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const handleScroll = () => {
			const scrollTop = window.scrollY || document.documentElement.scrollTop;
			setIsScrolled(scrollTop > threshold);
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		handleScroll(); // Check initial position

		return () => {
			window.removeEventListener("scroll", handleScroll);
		};
	}, [threshold]);

	return isScrolled;
}
