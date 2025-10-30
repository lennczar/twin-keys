import { KeyRound, Mail, Wallet } from "lucide-react";
import { useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";

export function Login() {
	const [email, setEmail] = useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		// TODO: Implement login logic
		console.log("Login attempt with:", email);
	};

	const handleWalletConnect = () => {
		// TODO: Integrate WalletConnect for Solana + Phantom
		// Will require @solana/wallet-adapter-react and related packages
		console.log("Wallet connect clicked");
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-200 to-base-100 p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center">
							<KeyRound className="w-8 h-8 text-primary-content" />
						</div>
					</div>
					<h1 className="text-4xl font-display font-bold mb-2">Welcome to Twin Keys</h1>
					<p className="text-base-content/70">Sign in to access your dashboard</p>
				</div>

				<div className="card bg-base-100 shadow-2xl">
					<div className="card-body">
						<form
							onSubmit={handleSubmit}
							className="space-y-6"
						>
							<Input
								type="email"
								label="Email Address"
								placeholder="your@email.com"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								fullWidth
							/>

							<Button
								type="submit"
								variant="primary"
								fullWidth
								size="lg"
							>
								<Mail className="w-5 h-5 mr-2" />
								Continue with Email
							</Button>

							<div className="divider">OR</div>

							{/* Placeholder for Wallet Connect */}
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
							>
								<Wallet className="w-5 h-5 mr-2" />
								Connect Wallet
							</Button>
						</form>

						<div className="text-center mt-6 text-sm text-base-content/70">
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
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
