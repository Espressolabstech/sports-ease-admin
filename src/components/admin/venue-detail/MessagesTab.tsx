import { MessageSquare } from 'lucide-react';

interface Props {
    venueId: string;
    venueName: string;
}

export default function VenueMessagesTab({ venueId, venueName }: Props) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl bg-card py-20 shadow-sm">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
            <h3 className="mt-4 text-base font-semibold text-foreground">Messages</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                In-app messaging with {venueName} is not available in this version.
            </p>
        </div>
    );
}
