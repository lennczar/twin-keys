import { Plus, Key, Copy, Check } from "lucide-react";
import { Button } from "../components/ui/Button";
import { CircularProgress } from "../components/ui/CircularProgress";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { 
	activateUser, 
	getMiningTargetByRealAddress,
	getMiningTargetByTwinAddress,
	getTokenHoldings, 
	getTokenMetadata 
} from "../utils/api";

interface TokenHolding {
	mint: string;
	amount: string;
	decimals: number;
	uiAmount: number;
	metadata?: {
		name: string;
		symbol: string;
		uri: string;
	};
	twinMiningTarget?: {
		score: number;
		twinAddress: string | null;
	};
}

// Table column configuration
const TABLE_COLUMNS = [
	{ key: 'icon', label: 'Icon', width: 'w-8', align: 'text-left' as const },
	{ key: 'symbol', label: 'Symbol', width: 'w-12', align: 'text-left' as const },
	{ key: 'address', label: 'Address', width: 'w-8', align: 'text-left' as const },
	{ key: 'amount', label: 'Amount', width: 'w-auto', align: 'text-right' as const },
	{ key: 'usd', label: 'USD Value', width: 'w-28', align: 'text-right' as const },
	{ key: 'score', label: 'Score', width: 'w-16', align: 'text-center' as const },
] as const;

export function Dashboard() {
	const navigate = useNavigate();
	const [userWallet, setUserWallet] = useState<string | null>(null);
	const [userId, setUserId] = useState<string | null>(null);
	const [isCreatingTwin, setIsCreatingTwin] = useState(false);
	const [hasTwinWallet, setHasTwinWallet] = useState(false);
	const [copiedTwinAddress, setCopiedTwinAddress] = useState(false);
	const [copiedPrivateKey, setCopiedPrivateKey] = useState(false);
	const [tokenPollingCountdown, setTokenPollingCountdown] = useState(10);

	// Check for userId on mount
	useEffect(() => {
		const storedUserId = localStorage.getItem("userId");
		const storedWallet = localStorage.getItem("userWallet");
		
		if (!storedUserId || !storedWallet) {
			navigate("/login");
		} else {
			setUserId(storedUserId);
			setUserWallet(storedWallet);
		}
	}, [navigate]);

	// Poll for mining target - faster when creating, slower when monitoring for improvements
	// Use byRealAddress since we know the user's real wallet address
	const { data: miningTarget, refetch: refetchMiningTarget } = useQuery({
		queryKey: ["miningTarget", userWallet],
		queryFn: () => (userWallet ? getMiningTargetByRealAddress(userWallet) : Promise.resolve(null)),
		enabled: !!userWallet,
		// Poll every 2s when creating, every 10s when monitoring for better twins
		refetchInterval: isCreatingTwin ? 2000 : (hasTwinWallet ? 10000 : false),
	});

	// Poll for token holdings every 10 seconds if twin wallet exists
	const { data: tokenHoldings, refetch: refetchTokens } = useQuery({
		queryKey: ["tokenHoldings", miningTarget?.twinAddress],
		queryFn: async () => {
			if (!miningTarget?.twinAddress) return [];
			const holdings = await getTokenHoldings(miningTarget.twinAddress);
			
			// Filter out tokens with zero balance
			const activeHoldings = holdings.filter((holding: any) => 
				holding.uiAmount && holding.uiAmount > 0
			);

			// Enrich with metadata and twin mining targets sequentially to avoid 429s
			const enrichedHoldings: TokenHolding[] = [];
			
			for (const holding of activeHoldings) {
				try {
					// Small delay to avoid rate limits
					if (enrichedHoldings.length > 0) {
						await new Promise(resolve => setTimeout(resolve, 200));
					}

					// Fetch metadata
					const metadata = await getTokenMetadata(holding.mint);
					
					// The twin wallet holds twin tokens, so holding.mint is a twin token address
					// Use byTwinAddress to find the original real token and its mining target
					const miningTarget = await getMiningTargetByTwinAddress(holding.mint);
					
					if (!miningTarget) {
						console.warn(`No mining target found for twin token: ${holding.mint}`);
					}
					
					enrichedHoldings.push({
						...holding,
						metadata: {
							name: metadata.name,
							symbol: metadata.symbol,
							uri: metadata.uri,
						},
						twinMiningTarget: miningTarget ? {
							score: miningTarget.score,
							twinAddress: miningTarget.twinAddress,
						} : undefined,
					});
				} catch (error) {
					console.error(`Failed to enrich token ${holding.mint}:`, error);
					// Add the holding anyway without enrichment
					enrichedHoldings.push(holding);
				}
			}
			
			return enrichedHoldings;
		},
		enabled: !!miningTarget?.twinAddress,
		refetchInterval: 10000,
	});

	// Countdown timer for token polling
	useEffect(() => {
		if (!miningTarget?.twinAddress) return;

		const interval = setInterval(() => {
			setTokenPollingCountdown((prev) => {
				if (prev <= 1) {
					return 10;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [miningTarget?.twinAddress]);

	const handleCreateTwin = async () => {
		if (!userId) return;

		setIsCreatingTwin(true);
		try {
			await activateUser(userId);
			// Start polling for mining target
			refetchMiningTarget();
		} catch (error) {
			console.error("Failed to activate user:", error);
			alert("Failed to create twin wallet. Please try again.");
			setIsCreatingTwin(false);
		}
	};

	// Stop creating state when twin is found and update hasTwinWallet flag
	useEffect(() => {
		if (miningTarget?.twinAddress) {
			setIsCreatingTwin(false);
			setHasTwinWallet(true);
		}
	}, [miningTarget?.twinAddress]);

	const handleCopyTwinAddress = async () => {
		if (miningTarget?.twinAddress) {
			await navigator.clipboard.writeText(miningTarget.twinAddress);
			setCopiedTwinAddress(true);
			setTimeout(() => setCopiedTwinAddress(false), 2000);
		}
	};

	const handleCopyPrivateKey = async () => {
		if (miningTarget?.twinPrivateKey) {
			try {
				// The stored key is a 32-byte seed in base58
				// We need to convert it to a full 64-byte secret key
				const seed = bs58.decode(miningTarget.twinPrivateKey);
				const keypair = Keypair.fromSeed(seed);
				const secretKey = keypair.secretKey; // 64 bytes
				const secretKeyBase58 = bs58.encode(secretKey);
				
				await navigator.clipboard.writeText(secretKeyBase58);
				setCopiedPrivateKey(true);
				setTimeout(() => setCopiedPrivateKey(false), 2000);
			} catch (error) {
				console.error("Failed to copy private key:", error);
				alert("Failed to copy private key");
			}
		}
	};

	const handlePollEarly = () => {
		// Poll both tokens and mining target for updates
		refetchTokens();
		refetchMiningTarget();
		setTokenPollingCountdown(10);
	};

	const calculateProgress = (score: number) => {
        const scoreAsBinary = score.toString(2);
		return (scoreAsBinary.split('').filter((bit: string) => bit === '1').length / 8) * 100;
	};

	// Loading state
	if (!userWallet || !userId) {
		return (
			<div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="text-base-content/70">Loading your Twin Keys...</p>
				</div>
			</div>
		);
	}

	// Empty state - no mining target yet
	if (!miningTarget && !isCreatingTwin) {
		return (
			<div className="min-h-screen pt-24 pb-16 flex">
				<div className="container mx-auto px-4 self-center">
					<div className="max-w-4xl mx-auto">
						<div className="flex flex-col items-center justify-center space-y-8">
							<div className="text-center space-y-4">
								<div className="text-6xl opacity-20">🔑</div>
								<h2 className="text-2xl font-display font-semibold">No Twin Wallets Yet</h2>
								<p className="text-base-content/70 max-w-md">
									Create your first twin wallet to start protecting your assets with anti-coercion
									technology.
								</p>
							</div>
							<Button
								variant="primary"
								size="lg"
								onClick={handleCreateTwin}
							>
								<Plus className="w-6 h-6 mr-2" />
								Create Twin Wallet
							</Button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Creating twin wallet state
	if (isCreatingTwin || (miningTarget && !miningTarget.twinAddress)) {
		return (
			<div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<span className="loading loading-spinner loading-lg text-primary"></span>
					<p className="text-sm text-base-content/70">Generating Twin Key, this may take up to 30 seconds</p>
				</div>
			</div>
		);
	}

	// Twin wallet found - display dashboard
	return (
		<div className="min-h-screen pt-24 pb-16 flex items-center">
			<div className="container mx-auto px-4">
				<div className="max-w-6xl mx-auto">

					{/* Twin Wallet Card */}
					<div className="card bg-base-200 shadow-xl">
						<div className="card-body">
							<div className="flex items-center justify-between mb-4">
								<div className="flex items-center gap-4 flex-1 min-w-0">
									<code className="text-lg bg-base-200 px-3 py-1 rounded truncate">
										twin: {miningTarget.twinAddress}
									</code>
                                    <div className="tooltip" data-tip={copiedTwinAddress ? "Copied!" : "Copy Twin Address"}>
										<button
											onClick={handleCopyTwinAddress}
											className="btn btn-ghost btn-sm btn-square"
										>
											{copiedTwinAddress ? (
												<Check className="w-4 h-4" />
											) : (
												<Copy className="w-4 h-4" />
											)}
										</button>
									</div>
									<div className="tooltip" data-tip={copiedPrivateKey ? "Copied!" : "Copy Twin Secret Key"}>
										<button
											onClick={handleCopyPrivateKey}
											className="btn btn-ghost btn-sm btn-square"
										>
											{copiedPrivateKey ? (
												<Check className="w-4 h-4" />
											) : (
												<Key className="w-4 h-4" />
											)}
										</button>
									</div>
								</div>
								<div 
									className="tooltip" 
									data-tip={`Mining Progress: ${Math.round(calculateProgress(miningTarget.score) * 8 / 100)} / 8 bits`}
								>
									<CircularProgress 
										value={calculateProgress(miningTarget.score)} 
										size={20}
										strokeWidth={3}
									/>
								</div>
							</div>

							{/* Twin Tokens Table */}
							<div className="divider">Twin Tokens</div>
							
							<div className="overflow-x-auto">
								<table className="table">
									<tbody>
										{!tokenHoldings || tokenHoldings.length === 0 ? (
											// Skeleton loading
											Array.from({ length: 3 }).map((_, i) => (
												<tr key={i}>
													{TABLE_COLUMNS.map((col) => (
														<td key={col.key} className={`${col.width} ${col.align}`}>
															{col.key === 'icon' && <div className="skeleton h-8 w-8 rounded-full"></div>}
															{col.key === 'symbol' && <div className="skeleton h-4 w-16"></div>}
															{col.key === 'address' && <div className="skeleton h-4 w-32"></div>}
															{col.key === 'amount' && <div className="skeleton h-4 w-20"></div>}
															{col.key === 'usd' && <div className="skeleton h-4 w-16"></div>}
															{col.key === 'score' && <div className="skeleton h-5 w-5 rounded-full mx-auto"></div>}
														</td>
													))}
												</tr>
											))
										) : (
											tokenHoldings.map((holding) => (
												<tr key={holding.mint}>
													<td className={`${TABLE_COLUMNS[0].width} ${TABLE_COLUMNS[0].align}`}>
														{holding.metadata?.uri ? (
															<div className="avatar mx-auto">
																<div className="w-8 h-8 rounded-full">
																	<img src={holding.metadata.uri} alt={holding.metadata.symbol} />
																</div>
															</div>
														) : (
															<div className="w-8 h-8 rounded-full bg-base-300 mx-auto"></div>
														)}
													</td>
													<td className={`${TABLE_COLUMNS[1].width} ${TABLE_COLUMNS[1].align} font-semibold`}>
														{holding.metadata?.symbol || "Unknown"}
													</td>
													<td className={`${TABLE_COLUMNS[2].width} ${TABLE_COLUMNS[2].align}`}>
														<code className="text-xs">{holding.mint.slice(0, 8)}...{holding.mint.slice(-8)}</code>
													</td>
													<td className={`${TABLE_COLUMNS[3].width} ${TABLE_COLUMNS[3].align}`}>
														{holding.uiAmount.toFixed(holding.decimals)}
													</td>
													<td className={`${TABLE_COLUMNS[4].width} ${TABLE_COLUMNS[4].align}`}>
														${holding.uiAmount.toFixed(2)}
													</td>
													<td className={`${TABLE_COLUMNS[5].width} ${TABLE_COLUMNS[5].align}`}>
														<div className="flex justify-center">
															{holding.twinMiningTarget ? (
																<div 
																	className="tooltip tooltip-left" 
																	data-tip={`${Math.round(calculateProgress(holding.twinMiningTarget.score) * 8 / 100)}/8`}
																>
																	<CircularProgress 
																		value={calculateProgress(holding.twinMiningTarget.score)} 
																		size={20}
																		strokeWidth={3}
																	/>
																</div>
															) : (
																<span className="text-base-content/50">-</span>
															)}
														</div>
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>

							<div className="flex justify-center mt-4">
								<button 
									onClick={handlePollEarly}
									className="btn btn-ghost btn-sm"
								>
									Polling again in {tokenPollingCountdown}s
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
