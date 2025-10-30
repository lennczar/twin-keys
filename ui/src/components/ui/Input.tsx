import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
	({ label, error, fullWidth = false, className = "", ...props }, ref) => {
		return (
			<div className={fullWidth ? "w-full" : ""}>
				{label && (
					<label className="label">
						<span className="label-text">{label}</span>
					</label>
				)}
				<input
					ref={ref}
					className={`input input-bordered ${fullWidth ? "w-full" : ""} ${error ? "input-error" : ""} ${className}`.trim()}
					{...props}
				/>
				{error && (
					<label className="label">
						<span className="label-text-alt text-error">{error}</span>
					</label>
				)}
			</div>
		);
	}
);

Input.displayName = "Input";

