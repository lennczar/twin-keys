interface CircularProgressProps {
	value: number; // 0-100
	size?: number; // in pixels
	strokeWidth?: number;
	className?: string;
}

export function CircularProgress({ 
	value, 
	size = 32, 
	strokeWidth = 3,
	className = ""
}: CircularProgressProps) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (value / 100) * circumference;

	return (
		<svg 
			width={size} 
			height={size} 
			className={className}
			viewBox={`0 0 ${size} ${size}`}
		>
			{/* Background circle */}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				className="text-base-300"
			/>
			{/* Progress circle */}
			<circle
				cx={size / 2}
				cy={size / 2}
				r={radius}
				fill="none"
				stroke="currentColor"
				strokeWidth={strokeWidth}
				strokeDasharray={circumference}
				strokeDashoffset={offset}
				strokeLinecap="round"
				className="text-primary transition-all duration-300"
				transform={`rotate(-90 ${size / 2} ${size / 2})`}
			/>
		</svg>
	);
}

