import { useNavigate } from '@tanstack/react-router';
import { Icon } from '../icons/Icon';
import { useTxnFiltersStore } from '../../stores/txnFiltersStore';

type Props = {
  count: number;
};

export function UncategorisedBanner({ count }: Props) {
  const navigate = useNavigate();
  const setCategory = useTxnFiltersStore((s) => s.setCategory);
  if (count <= 0) return null;
  return (
    <div className="dash-banner">
      <div className="tile">
        <Icon.Sparkles />
      </div>
      <div className="body">
        <div className="title">
          {count} transaction{count === 1 ? '' : 's'} need
          {count === 1 ? 's' : ''} categorising
        </div>
        <div className="sub">
          Bulk-tag them in seconds — we'll pre-apply the uncategorised filter
          for you.
        </div>
      </div>
      <button
        type="button"
        className="btn btn-primary"
        onClick={() => {
          setCategory('uncategorized');
          void navigate({ to: '/transactions' });
        }}
      >
        Review now <Icon.ChevronRight />
      </button>
    </div>
  );
}
