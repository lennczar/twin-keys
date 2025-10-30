import { Plus } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";

export function Dashboard() {
	const handleCreateTwin = () => {
		// TODO: Implement twin wallet creation
		console.log("Create twin wallet clicked");
	};

	return (
		<div className="min-h-screen pt-24 pb-16 flex">
			<div className="container mx-auto px-4 self-center">
				<div className="max-w-4xl mx-auto">

					{/* Placeholder State */}
					<div className="flex flex-col items-center justify-center space-y-8">
						<div className="text-center space-y-4">
							<div className="text-6xl opacity-20">🔑</div>
							<h2 className="text-2xl font-display font-semibold">No Twin Wallets Yet</h2>
							<p className="text-base-content/70 max-w-md">
								Create your first twin wallet to start protecting your assets with anti-coercion
								technology.
							</p>
						</div>
                        <Link to="/login">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleCreateTwin}
                            >
                                <Plus className="w-6 h-6 mr-2" />
                                Create Twin Wallet
                            </Button>
                        </Link>
					</div>
				</div>
			</div>
		</div>
	);
}
