import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/pp-ui';

export interface AuctionConfirmation {
    title: string;
    description: string;
    action: string;
    destructive?: boolean;
    run: () => Promise<unknown>;
}

export default function AuctionConfirmDialog({
    confirmation,
    busy,
    onClose,
    onConfirm,
}: {
    confirmation: AuctionConfirmation | null;
    busy: boolean;
    onClose: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog
            open={!!confirmation}
            onOpenChange={(open) => {
                if (!open && !busy) onClose();
            }}
        >
            <DialogContent className="pp-console pp-dialog">
                <DialogHeader>
                    <DialogTitle>{confirmation?.title}</DialogTitle>
                    <DialogDescription>{confirmation?.description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" disabled={busy} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant={confirmation?.destructive ? 'destructive' : 'outline'} disabled={busy} onClick={onConfirm}>
                        {confirmation?.action}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
