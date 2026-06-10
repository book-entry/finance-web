import { Icon } from '../icons/Icon';

type LinkAccountCardProps = {
  onClick: () => void;
};

export function LinkAccountCard({ onClick }: LinkAccountCardProps) {
  return (
    <button type="button" className="link-account-card" onClick={onClick}>
      <span className="plus-tile">
        <Icon.Plus />
      </span>
      <span className="title">Add a new account</span>
      <span className="sub">Track any bank or e-wallet manually</span>
    </button>
  );
}
