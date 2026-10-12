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
import Team from '../screens/Team/index';
import { RequirePermission } from '../components/admin/RequirePermission';
import Events from '../screens/Events/index';
import EventDetail from '../screens/Events/EventDetail';
import EventHostDetail from '../screens/Events/HostDetail';
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
            { path: 'dashboard', element: <RequirePermission permission="dashboard.view"><Dashboard /></RequirePermission> },
            { path: 'venues', element: <RequirePermission permission="venues.view"><Venues /></RequirePermission> },
            { path: 'venues/pending', element: <RequirePermission permission="venues.view"><VenuePending /></RequirePermission> },
            { path: 'venues/onboard', element: <RequirePermission permission="venues.manage"><OnboardVenue /></RequirePermission> },
            { path: 'venues/:venueId/review', element: <RequirePermission permission="venues.view"><VenueReview /></RequirePermission> },
            { path: 'venues/:venueId', element: <RequirePermission permission="venues.view"><VenueDetail /></RequirePermission> },
            { path: 'bookings', element: <RequirePermission permission="bookings.view"><Bookings /></RequirePermission> },
            { path: 'events', element: <RequirePermission permission="events.view"><Events /></RequirePermission> },
            { path: 'events/:eventId', element: <RequirePermission permission="events.view"><EventDetail /></RequirePermission> },
            { path: 'event-hosts/:hostId', element: <RequirePermission permission="events.view"><EventHostDetail /></RequirePermission> },
            { path: 'players', element: <RequirePermission permission="players.view"><Players /></RequirePermission> },
            { path: 'courts', element: <RequirePermission permission="courts.view"><Courts /></RequirePermission> },
            { path: 'payouts', element: <RequirePermission permission="payouts.view"><Payouts /></RequirePermission> },
            { path: 'ledger', element: <RequirePermission permission="ledger.view"><Ledger /></RequirePermission> },
            { path: 'invitations', element: <RequirePermission permission="invitations.manage"><Invitation /></RequirePermission> },
            { path: 'team', element: <RequirePermission permission="admins.manage"><Team /></RequirePermission> },
            { path: 'settings', element: <RequirePermission permission="settings.view"><Settings /></RequirePermission> },
        ],
    },
    { path: '/', element: <Navigate to="/admin/dashboard" replace /> },
    { path: '*', element: <PageNotFound /> },
]);
