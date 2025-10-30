import { ReactNode } from "react";
import { Button } from "./Button";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: ReactNode;
	showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, children, showCloseButton = true }: ModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50 backdrop-blur-sm"
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div className="relative bg-base-100 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-10">
				{/* Close X button - top right */}
				{showCloseButton && (
					<button
						onClick={onClose}
						className="absolute top-4 right-4 text-base-content/50 hover:text-base-content transition-colors"
						aria-label="Close"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="18" y1="6" x2="6" y2="18"></line>
							<line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
					</button>
				)}

				{title && <h3 className="text-2xl font-display font-semibold mb-4 pr-8">{title}</h3>}

				<div className="mb-6">{children}</div>

				{showCloseButton && (
					<div className="flex justify-end">
						<Button
							onClick={onClose}
							variant="primary"
							size="sm"
						>
							Close
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

