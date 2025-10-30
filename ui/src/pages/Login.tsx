import { useWallet } from "@solana/wallet-adapter-react";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { WalletButton } from "../components/wallet/WalletButton";
import logo from "../assets/twin-keys-logo-blue.svg";

type AuthMode = "signin" | "login";

export function Login() {
	const [mode, setMode] = useState<AuthMode>("signin");
	const [email, setEmail] = useState("");
	const [showModal, setShowModal] = useState(false);
	const { publicKey, connected } = useWallet();

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		
		if (mode === "signin") {
			// Sign In requires both email and wallet
			if (!email || !connected) {
				alert("Please provide both email and connect your wallet");
				return;
			}
			console.log("Sign up attempt with:", { 
				email, 
				walletAddress: publicKey?.toString() 
			});
			// TODO: Send sign up request to API
			setShowModal(true);
		} else {
			// Log In requires only wallet
			if (!connected) {
				alert("Please connect your wallet");
				return;
			}
			console.log("Log in attempt with wallet:", publicKey?.toString());
			// TODO: Send login request to API
			setShowModal(true);
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
							<div className="flex flex-col gap-2">
								<WalletButton
									fullWidth
									size="lg"
								/>
							</div>

							{mode === "signin" && (
								<Button
									type="submit"
									variant="primary"
									fullWidth
									size="lg"
									disabled={!connected || !email}
								>
									<Mail className="w-5 h-5 mr-2" />
									Join the waitlist
								</Button>
							)}

							{mode === "login" && (
								<Button
									type="submit"
									variant="primary"
									fullWidth
									size="lg"
									disabled={!connected}
								>
									<KeyRound className="w-5 h-5 mr-2" />
									Join the waitlist
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
								onClick={() => setMode(mode === "signin" ? "login" : "signin")}
								className="text-sm text-base-content/70 hover:text-primary transition-colors"
							>
								{mode === "signin" ? "Log In instead" : "Sign Up instead"}
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Waiting List Modal */}
			<Modal
				isOpen={showModal}
				onClose={() => setShowModal(false)}
				title="We added you to the waitlist!"
			>
				<div className="space-y-4">
					<p className="text-base-content/70">
						Thank you for joining the waitlist! We'll reach out when Twin Keys launches.
					</p>
				</div>
			</Modal>
		</div>
	);
    
}
