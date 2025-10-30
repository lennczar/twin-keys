import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Router } from "./router";

// Create a client for TanStack Query
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchOnWindowFocus: false,
		},
	},
});

const root = createRoot(document.body);

root.render(
	<QueryClientProvider client={queryClient}>
		<Router />
	</QueryClientProvider>
);
