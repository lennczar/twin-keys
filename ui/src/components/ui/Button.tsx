import { ReactNode } from "react";
import { BUTTON_VARIANTS } from "../../constants/theme";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: ReactNode;
	variant?: "primary" | "secondary";
	size?: "xs" | "sm" | "md" | "lg";
	fullWidth?: boolean;
	loading?: boolean;
}

export function Button({
	children,
	variant = "primary",
	size = "md",
	fullWidth = false,
	loading = false,
	className = "",
	disabled,
	...props
}: ButtonProps) {
	const variantClass = BUTTON_VARIANTS[variant];
	const sizeClass = size !== "md" ? `btn-${size}` : "";
	const widthClass = fullWidth ? "w-full" : "";
	const loadingClass = loading ? "loading" : "";

	return (
		<button
			className={`btn ${variantClass} ${sizeClass} ${widthClass} ${loadingClass} ${className}`.trim()}
			disabled={disabled || loading}
			{...props}
		>
			{children}
		</button>
	);
}

