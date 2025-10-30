import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { WalletButton } from "../components/wallet/WalletButton";
import logo from "../assets/twin-keys-logo-blue.svg";
import { createUser, getUsers } from "../utils/api";

type AuthMode = "signup" | "login";

export function Login() {
	const [mode, setMode] = useState<AuthMode>("signup");
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { publicKey, connected } = useWallet();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);
		
		try {
			if (mode === "signup") {
				// Sign Up requires both email and wallet
				if (!email || !connected || !publicKey) {
					setError("Please provide both email and connect your wallet");
					setIsLoading(false);
					return;
				}

				const walletAddress = publicKey.toString();
				console.log("Sign up attempt with:", { email, walletAddress });

				// Create user account
				const user = await createUser(email, walletAddress);
				
				// Store userId in localStorage
				localStorage.setItem("userId", user.id);
				localStorage.setItem("userWallet", walletAddress);

				// Redirect to dashboard
				navigate("/dashboard");
			} else {
				// Log In requires only wallet
				if (!connected || !publicKey) {
					setError("Please connect your wallet");
					setIsLoading(false);
					return;
				}

				const walletAddress = publicKey.toString();
				console.log("Log in attempt with wallet:", walletAddress);

				// Find user by wallet
				const users = await getUsers();
				const user = users.find((u: any) => u.wallet === walletAddress);

				if (!user) {
					setError("No account found for this wallet. Please sign up first.");
					setIsLoading(false);
					return;
				}

				// Store userId in localStorage
				localStorage.setItem("userId", user.id);
				localStorage.setItem("userWallet", walletAddress);

				// Redirect to dashboard
				navigate("/dashboard");
			}
		} catch (err) {
			console.error("Auth error:", err);
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-linear-to-br from-base-200 to-base-100 p-4">
			<div className="w-full max-w-md">
				<div className="text-center mb-8">
					<div className="flex justify-center mb-4">
						<img src={logo} alt="Twin Keys" className="w-16 h-16" />
					</div>
					<h1 className="text-4xl font-display font-bold mb-2">Welcome to Twin Keys</h1>
					<p className="text-base-content/70">
						{mode === "signup" 
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
							{error && (
								<div className="alert alert-error">
									<span>{error}</span>
								</div>
							)}

							{mode === "signup" && (
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
							<div className="flex flex-col gap-2">
								<WalletButton
									fullWidth
									size="lg"
								/>
							</div>

							{mode === "signup" && (
								<Button
									type="submit"
									variant="primary"
									fullWidth
									size="lg"
									disabled={!connected || !email}
									loading={isLoading}
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
									disabled={!connected}
									loading={isLoading}
								>
									<KeyRound className="w-5 h-5 mr-2" />
									Log In
								</Button>
							)}
						</form>

                        
						<div className="mt-6 flex flex-row items-center justify-between gap-2">
                            {/* Back Button */}
                            <Link
                                to="/"
                            >
                                <button
                                    type="button"
                                    className="text-sm flex flex-row items-center justify-center text-base-content/70 hover:text-primary transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5 mr-2" />
                                    Back
                                </button>
                            </Link>
						    {/* Mode Switch */}
							<button
								type="button"
								onClick={() => setMode(mode === "signup" ? "login" : "signup")}
								className="text-sm text-base-content/70 hover:text-primary transition-colors"
							>
								{mode === "signup" ? "Log In instead" : "Sign Up instead"}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
    
}
