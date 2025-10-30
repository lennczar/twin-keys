import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";

interface WalletButtonProps {
	fullWidth?: boolean;
	size?: "xs" | "sm" | "md" | "lg";
}

export function WalletButton({ fullWidth = false, size = "lg" }: WalletButtonProps) {
	const { publicKey, disconnect, connected, connecting } = useWallet();
	const { setVisible } = useWalletModal();
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	const handleClick = () => {
		if (connected) {
			disconnect();
		} else {
			setVisible(true);
		}
	};

	// Avoid hydration mismatch
	if (!mounted) {
		return (
			<Button
				type="button"
				variant="secondary"
				fullWidth={fullWidth}
				size={size}
				disabled
			>
				<Wallet className="w-5 h-5 mr-2" />
				Loading...
			</Button>
		);
	}

	return (
		<Button
			type="button"
			variant="secondary"
			fullWidth={fullWidth}
			size={size}
			onClick={handleClick}
			loading={connecting}
			className={connected ? "bg-success border-none text-success-content hover:bg-success/90" : ""}
		>
			<Wallet className="w-5 h-5 mr-2" />
			{connecting ? "Connecting..." : connected ? `Connected: ${publicKey?.toString().slice(0, 8)}...
										${publicKey?.toString().slice(-8)}` : "Connect Wallet"}
		</Button>
	);
}

