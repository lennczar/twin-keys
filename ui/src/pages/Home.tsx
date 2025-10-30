import { ArrowRight, Eye, Lock, Shield, Wallet } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import Dither from "../components/ui/Dither";

export function Home() {
	const [activeTab, setActiveTab] = useState<"short" | "medium" | "long">("short");

	const content = {
		short: {
			title: "One",
			text: "Twin-Keys creates and maintains realistic twin wallets that mirror real on-chain activity, allowing users to protect their assets while preserving credibility under pressure.",
		},
		medium: {
			title: "Three",
			text: "Twin-Keys reduces the personal risk of holding digital assets by creating and maintaining a secondary wallet that mirrors the activity of a real wallet on the Solana blockchain. This twin wallet can be shown or used under pressure while real assets remain protected. The system observes token movements, reproduces transaction patterns, and maintains synchronized behavior without accessing private keys.",
		},
		long: {
			title: "Five",
			text: "Twin-Keys is an anti-coercion protection system for self-custody wallets that reduces the personal risk of holding digital assets. It creates and maintains a secondary wallet that mirrors the activity of a real wallet on the Solana blockchain, which can be shown or used under pressure while real assets remain protected. The system monitors specified wallets in real-time, recording deposits, withdrawals, and transfers to reproduce accurate transaction patterns without accessing private keys. A visually similar twin wallet is generated to act as a safe counterpart, mimicking the name, tokens, and general balance composition using non-valuable tokens. This provides protection under coercion, lowers personal exposure when managing digital assets, and is useful for demonstrations, training, or product testing without real assets at risk.",
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
					<div className="w-full flex flex-col lg:flex-row gap-8 items-center mb-16">
						<div className="w-full">
							<div className="flex items-center gap-6 mb-6">
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
							<div className="card bg-base-200 text-base-content flex flex-col max-w-full min-w-xl mx-12">
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
									<p className="pr-0 pl-2 py-1 rounded-md leading-none h-7 tab text-base-content">
										{activeTab !== "short" ? "sentences" : "sentence"}
									</p>
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
						{/* Wallet Monitoring - Large */}
						<div className="md:col-span-4 md:row-span-2 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Eye className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display text-2xl">Wallet Monitoring</h3>
								<p className="text-base-content/80 leading-relaxed">
									Twin-Keys observes token movements on specified wallets and records deposits,
									withdrawals, and transfers in real time. This continuous monitoring allows the
									system to reproduce accurate transaction patterns without requiring access to
									private keys, ensuring your actual wallet security remains intact while building a
									credible twin.
								</p>
							</div>
						</div>

						{/* Twin Generation - Medium */}
						<div className="md:col-span-2 md:row-span-1 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Wallet className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display">Twin Wallet Generation</h3>
								<p className="text-base-content/80">
									Creates a visually similar wallet that mimics the name, tokens, and balance
									composition of your original wallet using non-valuable tokens.
								</p>
							</div>
						</div>

						{/* Behavior Mirroring - Medium */}
						<div className="md:col-span-2 md:row-span-1 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center mb-4">
									<Shield className="w-6 h-6 text-primary" />
								</div>
								<h3 className="card-title font-display">Behavior Mirroring</h3>
								<p className="text-base-content/80">
									The twin reproduces the visible activity of the real wallet. Transaction history and
									token lists remain synchronized for credible observation.
								</p>
							</div>
						</div>

						{/* Anti-coercion Protection - Wide */}
						<div className="md:col-span-3 md:row-span-1 card bg-primary text-primary-content hover:shadow-xl transition-shadow">
							<div className="card-body">
								<div className="w-12 h-12 rounded bg-white/20 flex items-center justify-center mb-4">
									<Lock className="w-6 h-6" />
								</div>
								<h3 className="card-title font-display text-xl">Protection Under Coercion</h3>
								<p className="opacity-90">
									Provides a believable wallet alternative that can be shown if forced to reveal
									funds. Your real assets remain protected while maintaining credibility in
									high-pressure situations.
								</p>
							</div>
						</div>

						{/* Privacy - Wide */}
						<div className="md:col-span-3 md:row-span-1 card bg-base-200 hover:shadow-xl transition-shadow">
							<div className="card-body">
								<h3 className="card-title font-display text-xl">Privacy and Peace of Mind</h3>
								<p className="text-base-content/80">
									Lowers personal exposure when managing digital assets. Useful for demonstrations,
									training, or product testing without putting real assets at risk.
								</p>
							</div>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
