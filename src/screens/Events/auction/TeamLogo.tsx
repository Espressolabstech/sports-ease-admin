import { initials } from '../../../lib/auction';
import { VariantImg } from '../../../components/VariantImg';

export function TeamLogo({ name, logoUrl, size = 28 }: { name: string; logoUrl: string | null; size?: number }) {
    const style = { width: size, height: size, fontSize: size * 0.36 };
    if (logoUrl) return <VariantImg src={logoUrl} size="thumb" alt="" className="rounded-full object-cover shrink-0" style={style} />;
    return (
        <span
            aria-hidden="true"
            className="rounded-full shrink-0 grid place-items-center font-semibold"
            style={{ ...style, background: 'var(--secondary)', color: 'var(--muted-foreground)' }}
        >
            {initials(name).slice(0, 2)}
        </span>
    );
}
