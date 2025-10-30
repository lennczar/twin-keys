import { ReactNode } from "react";

interface CardProps {
	children: ReactNode;
	className?: string;
	hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
	return (
		<div
			className={`card bg-base-100 shadow-xl ${hover ? "hover:shadow-2xl transition-shadow" : ""} ${className}`.trim()}
		>
			{children}
		</div>
	);
}

interface CardBodyProps {
	children: ReactNode;
	className?: string;
}

export function CardBody({ children, className = "" }: CardBodyProps) {
	return <div className={`card-body ${className}`.trim()}>{children}</div>;
}
