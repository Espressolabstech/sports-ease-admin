import { RouterProvider } from 'react-router-dom';
import { router } from './navigation/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
            <Toaster richColors position="top-right" />
        </QueryClientProvider>
    );
}

export default App;
