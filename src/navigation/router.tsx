import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AdminLayout } from '../layouts/AdminLayout';
import Login from '../screens/Login/index';
import Dashboard from '../screens/Dashboard/index';
import Venues from '../screens/Venues/index';
import VenueDetail from '../screens/Venues/VenueDetail';
import VenuePending from '../screens/Venues/VenuePending';
import VenueReview from '../screens/Venues/VenueReview';
import OnboardVenue from '../screens/Venues/OnboardVenue';
import Bookings from '../screens/Bookings/index';
import Players from '../screens/Players/index';
import Courts from '../screens/Courts/index';
import Payouts from '../screens/Payouts/index';
import Ledger from '../screens/Ledger/index';
import Invitation from '../screens/Invitation/index';
import Settings from '../screens/settings/index';
const PageNotFound = () => <div className="flex min-h-screen items-center justify-center text-muted-foreground">404 — Page not found</div>;

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/admin',
        element: <AdminLayout />,
        children: [
            { index: true, element: <Navigate to="/admin/dashboard" replace /> },
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'venues', element: <Venues /> },
            { path: 'venues/pending', element: <VenuePending /> },
            { path: 'venues/onboard', element: <OnboardVenue /> },
            { path: 'venues/:venueId/review', element: <VenueReview /> },
            { path: 'venues/:venueId', element: <VenueDetail /> },
            { path: 'bookings', element: <Bookings /> },
            { path: 'players', element: <Players /> },
            { path: 'courts', element: <Courts /> },
            { path: 'payouts', element: <Payouts /> },
            { path: 'ledger', element: <Ledger /> },
            { path: 'invitations', element: <Invitation /> },
            { path: 'settings', element: <Settings /> },
        ],
    },
    { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
    { path: '*', element: <PageNotFound /> },
]);
