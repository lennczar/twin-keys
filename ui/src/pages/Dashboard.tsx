import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";

export function Dashboard() {
	const handleCreateTwin = () => {
		// TODO: Implement twin wallet creation
		console.log("Create twin wallet clicked");
	};

	return (
		<div className="min-h-screen pt-24 pb-16">
			<div className="container mx-auto px-4">
				<div className="max-w-4xl mx-auto">
					<div className="text-center mb-12">
						<h1 className="text-5xl font-display font-bold mb-4">Dashboard</h1>
						<p className="text-xl text-base-content/70">Manage your twin wallets</p>
					</div>

					{/* Placeholder State */}
					<div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
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
