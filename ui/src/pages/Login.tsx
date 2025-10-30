import { KeyRound, Mail, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import logo from "../assets/twin-keys-logo-blue.svg";

type AuthMode = "signin" | "login";

export function Login() {
	const [mode, setMode] = useState<AuthMode>("signin");
	const [email, setEmail] = useState("");
	const [walletConnected, setWalletConnected] = useState(false);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (mode === "signin") {
			// Sign In requires both email and wallet
			if (!email || !walletConnected) {
				alert("Please provide both email and connect your wallet");
				return;
			}
			console.log("Sign in attempt with:", { email, wallet: walletConnected });
		} else {
			// Log In requires only wallet
			if (!walletConnected) {
				alert("Please connect your wallet");
				return;
			}
			console.log("Log in attempt with wallet");
		}
	};

	const handleWalletConnect = () => {
		// TODO: Integrate WalletConnect for Solana + Phantom
		// Will require @solana/wallet-adapter-react and related packages
		console.log("Wallet connect clicked");
		setWalletConnected(true);
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-100 p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<img src={logo} alt="Twin Keys" className="w-16 h-16" />
					</div>
					<h1 className="text-4xl font-display font-bold mb-2">Welcome to Twin Keys</h1>
					<p className="text-base-content/70">
						{mode === "signin" 
							? "Create an account with email and wallet" 
							: "Access your dashboard with wallet"}
					</p>
				</div>

				<div className="card">
					<div className="card-body">
						<form
							onSubmit={handleSubmit}
							className="space-y-6"
						>
							{mode === "signin" && (
								<Input
									type="email"
									label="Email Address"
									placeholder="your@email.com"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									fullWidth
								/>
							)}

							{/* Wallet Connect Button */}
							{/* TODO: Integrate Solana wallet adapters:
                                - @solana/wallet-adapter-react
                                - @solana/wallet-adapter-wallets
                                - @solana/wallet-adapter-base
                                Configure for Solana mainnet and Phantom wallet
                            */}
							<Button
								type="button"
								variant="secondary"
								fullWidth
								size="lg"
								onClick={handleWalletConnect}
								className={walletConnected ? "bg-success text-success-content hover:bg-success/90" : ""}
							>
								<Wallet className="w-5 h-5 mr-2" />
								{walletConnected ? "Wallet Connected" : "Connect Wallet"}
							</Button>

							{mode === "signin" && (
								<Button
									type="submit"
									variant="primary"
									fullWidth
									size="lg"
									disabled={!walletConnected || !email}
								>
									<Mail className="w-5 h-5 mr-2" />
									Sign Up
								</Button>
							)}

							{mode === "login" && (
								<Button
									type="submit"
									variant="primary"
									fullWidth
									size="lg"
									disabled={!walletConnected}
								>
									<KeyRound className="w-5 h-5 mr-2" />
									Log In
								</Button>
							)}
						</form>

						{/* Mode Switch */}
						<div className="text-center mt-6">
							<button
								type="button"
								onClick={() => setMode(mode === "signin" ? "login" : "signin")}
								className="text-sm text-base-content/70 hover:text-primary transition-colors"
							>
								{mode === "signin" ? "Log In instead" : "Sign Up instead"}
							</button>
						</div>

						{/* <div className="text-center mt-6 text-sm text-base-content/70">
							<p>
								By continuing, you agree to our{" "}
								<a
									href="#"
									className="link link-primary"
								>
									Terms of Service
								</a>{" "}
								and{" "}
								<a
									href="#"
									className="link link-primary"
								>
									Privacy Policy
								</a>
							</p>
						</div> */}
					</div>
				</div>
			</div>
		</div>
	);
}
