declare global {
    /** Admin auction adapters re-wrap apiClient's unwrapped data in this shape. */
    interface ApiResponse<T> {
        message?: string;
        data: T;
    }

    type AuctionLotStatus = 'WAITING' | 'LIVE' | 'SOLD' | 'UNSOLD';
    type AuctionPhase = 'CATEGORIES' | 'REAUCTION';

    interface ApiAuctionTeam {
        id: string;
        name: string;
        logoUrl: string | null;
        purseInr: number;
        spentInr: number;
        remainingInr: number;
        sort: number;
        squadCount: number;
        womenCount: number;
    }

    interface ApiAuctionCategory {
        id: string;
        eventId: string;
        name: string;
        basePriceInr: number;
        retentionMultiplier: number;
        sort: number;
        createdAt: string;
    }

    type AuctionSkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

    interface ApiAuctionLot {
        id: string;
        /** Draw number — what the organizer calls out when drawing from the bowl. */
        number: number | null;
        entrantId: string;
        name: string;
        photoUrl: string | null;
        gender: string | null;
        sports: string[];
        /** The organizer's saved level, else the registration answer. */
        padelLevel: AuctionSkillLevel | null;
        pickleballLevel: AuctionSkillLevel | null;
        /** Both levels were saved by the organizer. */
        levelsConfirmed: boolean;
        levelsConfirmedBy: string | null;
        levelsConfirmedAt: string | null;
        registeredPadelLevel: AuctionSkillLevel | null;
        registeredPickleballLevel: AuctionSkillLevel | null;
        achievements: string | null;
        categoryId: string | null;
        status: AuctionLotStatus;
        teamId: string | null;
        priceInr: number | null;
        effectiveBasePriceInr: number;
        soldAt: string | null;
        updatedAt: string;
        reauctioned: boolean;
        retained: boolean;
        corrected: boolean;
    }

    interface ApiAuctionState {
        currentLotId: string | null;
        currentCategoryId: string | null;
        phase: AuctionPhase;
    }

    interface ApiAuctionTeamMember {
        id: string;
        teamId: string;
        name: string;
        phone: string;
    }

    interface ApiAuctionBoardData {
        setUp: boolean;
        teams: ApiAuctionTeam[];
        categories: ApiAuctionCategory[];
        lots: ApiAuctionLot[];
        state: ApiAuctionState;
        retentionOpen: boolean;
        /** Host console / admin only. */
        members?: ApiAuctionTeamMember[];
        /** Team view only: the logged-in team user's own team. */
        myTeamId?: string;
    }

    /** Public live screen: no purses, spend or squads. */
    interface ApiAuctionLiveData {
        setUp: boolean;
        teams: Pick<ApiAuctionTeam, 'id' | 'name' | 'logoUrl' | 'sort'>[];
        categories: ApiAuctionCategory[];
        lots: ApiAuctionLot[];
        state: ApiAuctionState;
        retentionOpen: boolean;
        counts: {
            total: number;
            sold: number;
            byCategory: { categoryId: string; total: number; waiting: number }[];
        };
    }

    interface ApiAuctionTransaction {
        id: string;
        eventId: string;
        kind: string;
        lotId: string | null;
        teamId: string | null;
        amountInr: number | null;
        details: string;
        createdAt: string;
    }

    interface ApiAuctionTransactionsData {
        transactions: ApiAuctionTransaction[];
    }
}

export {};
