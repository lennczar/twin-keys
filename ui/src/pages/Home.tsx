import { AlertTriangle, ArrowRight, Bell, Copy, Eye, Lock, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import Dither from "../components/ui/Dither";

export function Home() {
	const [activeTab, setActiveTab] = useState<"short" | "medium" | "long">("short");

	const content = {
		short: {
			title: "Essence",
			text: "A decoy wallet filled with fake tokens that look identical to real ones.\n\nWhen threatened, send worthless tokens instead of your real assets.",
		},
		medium: {
			title: "Short",
			text: "Twin-Keys creates a decoy wallet with visually identical fake tokens.\n\nThe twin mirrors your real wallet's activity in real-time.\n\nUnder coercion, send the worthless tokens to protect your real assets.",
		},
		long: {
			title: "Detail",
			text: "Twin-Keys generates a decoy wallet that mirrors your real wallet on Solana.\n\nFake tokens are visually indistinguishable from legitimate ones.\n\nActivity syncs in real-time without accessing your private keys.\n\nSend worthless tokens when forced, protecting your actual holdings.\n\nTrigger emergency alerts when the twin is used—notify contacts or authorities.",
		},
	};

	return (
		<div className="min-h-screen">
			{/* Hero Section */}
			<section className="min-h-screen flex items-center justify-center bg-linear-to-b from-base-200 to-base-100 relative overflow-hidden">
				{/* Dither effect background */}
				<div className="absolute inset-0">
					<Dither
						waveColor={[0, 0, 1]}
						disableAnimation={false}
						enableMouseInteraction={false}
						mouseRadius={0.5}
						colorNum={3}
						waveAmplitude={0.1}
						waveFrequency={0}
						waveSpeed={0.025}
						pixelSize={3}
					/>
				</div>

				{/* Gradient overlay - transparent to white at bottom 10% */}
				<div
					className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white pointer-events-none"
					style={{ background: "linear-gradient(to bottom, transparent 90%, white 100%)" }}
				></div>
				<div
					className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-white pointer-events-none"
					style={{ background: "linear-gradient(to top, transparent 90%, white 100%)" }}
				></div>

				<div className="container mx-auto px-4 relative z-10 pt-24">
					<div className="w-full flex flex-row gap-12 items-center mb-16 justify-around">
						<div className="w-full">
							<div className="flex items-center gap-6 mb-6 min-w-[600px]">
								<h1 className="text-6xl md:text-7xl font-display font-bold mr-6">Twin Keys</h1>
								<Link to="/login">
									<Button
										variant="secondary"
										size="lg"
									>
										Get your twin
										<ArrowRight className="w-5 h-5 ml-1" />
									</Button>
								</Link>
							</div>
							{/* <p className="text-xl md:text-2xl text-base-content/70 mb-6">
								Anti-coercion protection for self-custody wallets
							</p> */}
						</div>
						<div className="w-full lg:flex-basis-1/2 flex items-center justify-center lg:justify-start">
							<div className="card bg-base-200 text-base-content flex flex-col max-w-full min-w-xl">
								<div
									role="tablist"
									className="tabs tabs-bordered mx-6 my-4"
								>
									<p className="pl-0 pr-2 py-1 rounded-md leading-none h-7 tab text-base-content">
										Twin Keys in
									</p>
									<a
										role="tab"
										className={`tab px-4 py-1 rounded-md leading-none h-7 ${activeTab === "short" ? "tab-active bg-base-content/10" : ""}`}
										onClick={() => setActiveTab("short")}
									>
										{content.short.title}
									</a>
									<a
										role="tab"
										className={`tab px-4 py-1 rounded-md leading-none h-7 ${activeTab === "medium" ? "tab-active bg-base-content/10" : ""}`}
										onClick={() => setActiveTab("medium")}
									>
										{content.medium.title}
									</a>
									<a
										role="tab"
										className={`tab px-4 py-1 rounded-md leading-none h-7 ${activeTab === "long" ? "tab-active bg-base-content/10" : ""}`}
										onClick={() => setActiveTab("long")}
									>
										{content.long.title}
									</a>
								</div>

								<div className="px-6 py-4">
									<p>{content[activeTab].text}</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Feature Bento Grid */}
			<section className="py-24 bg-base-100">
				<div className="container mx-auto px-4">
					<h2 className="text-4xl md:text-5xl font-display font-bold text-center mb-16">Core Features</h2>

					<div className="grid grid-cols-1 md:grid-cols-6 gap-6 max-w-7xl mx-auto">
						{/* Real-time Mirroring - Large */}
						<div className="md:col-span-4 md:row-span-2 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Eye className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display text-2xl">Real-Time Activity Mirroring</h3>
								<p className="text-base-content/80 leading-relaxed">
									Twin-Keys monitors your main wallet and automatically replicates all token movements
									to your decoy wallet in real-time. Deposits, withdrawals, and transfers are mirrored
									instantly, creating a convincing transaction history. The synchronization happens
									without ever accessing your private keys, keeping your actual wallet completely
									secure.
								</p>
							</div>
						</div>

						{/* Identical Fake Tokens - Medium */}
						<div className="md:col-span-2 md:row-span-1 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Copy className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display">Visually Identical Tokens</h3>
								<p className="text-base-content/80">
									Fake tokens in your twin wallet are virtually indistinguishable from real ones. Same
									names, logos, and balances—but completely worthless.
								</p>
							</div>
						</div>

						{/* Emergency Alerts - Medium */}
						<div className="md:col-span-2 md:row-span-1 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Bell className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display">Emergency Alerts</h3>
								<p className="text-base-content/80">
									Configure custom triggers when your twin wallet is used. Send your location to
									authorities or notify emergency contacts automatically.
								</p>
							</div>
						</div>

						{/* Decoy Protection - Wide */}
						<div className="md:col-span-3 md:row-span-1 card bg-primary text-primary-content hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center mb-4">
									<Lock className="w-6 h-6" />
								</div>
								<h3 className="card-title font-display text-xl">Send Fake Tokens Under Threat</h3>
								<p className="opacity-90">
									Add the twin wallet to your Web3 wallet app. When forced to send tokens under
									coercion, send the worthless fakes instead. Your real assets stay protected while
									maintaining complete credibility.
								</p>
							</div>
						</div>

						{/* Web3 Integration - Wide */}
						<div className="md:col-span-3 md:row-span-1 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Wallet className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display text-xl">Works With Your Wallet</h3>
								<p className="text-base-content/80">
									Import your twin wallet into Phantom, Solflare, or any Solana wallet. It appears and
									functions like a normal wallet—complete with transaction history and realistic
									balances.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
