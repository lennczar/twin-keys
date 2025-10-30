import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { ReactNode, useMemo } from "react";

interface WalletContextProviderProps {
	children: ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
	// Use Solana mainnet-beta, can change to 'devnet' or 'testnet' for testing
	const endpoint = useMemo(() => clusterApiUrl("mainnet-beta"), []);

	// Initialize wallet adapters - adding Phantom as primary
	const wallets = useMemo(
		() => [
			new PhantomWalletAdapter(),
			// Can add more wallet adapters here:
			// new SolflareWalletAdapter(),
			// new LedgerWalletAdapter(),
		],
		[]
	);

	return (
		<ConnectionProvider endpoint={endpoint}>
			<WalletProvider
				wallets={wallets}
				autoConnect={true}
			>
				<WalletModalProvider>{children}</WalletModalProvider>
			</WalletProvider>
		</ConnectionProvider>
	);
}

