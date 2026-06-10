import type { Category } from '../../api/categories';
import { styleForCategory } from '../../lib/categoryStyles';
import { usePrefsStore } from '../../stores/prefsStore';
import { Icon } from '../icons/Icon';

type CategoryChipProps = {
  category: Category | null;
  size?: 'md' | 'lg';
  onClick?: () => void;
  asButton?: boolean;
};

export function CategoryChip({
  category,
  size = 'md',
  onClick,
  asButton = true,
}: CategoryChipProps) {
  const chipStyle = usePrefsStore((s) => s.chipStyle);
  const Tag = asButton ? 'button' : 'span';

  if (!category) {
    return (
      <Tag
        type={asButton ? 'button' : undefined}
        className={'cat-chip uncategorized' + (size === 'lg' ? ' lg' : '')}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <span className="chip-ico">
          <Icon.Plus />
        </span>
        Uncategorized
      </Tag>
    );
  }

  const style = styleForCategory(category);
  const iconBody =
    chipStyle === 'emoji' ? (
      <span style={{ fontSize: size === 'lg' ? 13 : 11 }}>{style.emoji}</span>
    ) : chipStyle === 'dot' ? null : (
      <span
        style={{
          fontSize: size === 'lg' ? 11 : 9,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.95)',
        }}
      >
        {style.glyph}
      </span>
    );

  return (
    <Tag
      type={asButton ? 'button' : undefined}
      className={
        'cat-chip' +
        (size === 'lg' ? ' lg' : '') +
        (chipStyle === 'dot' ? ' dot' : '')
      }
      style={{ ['--chip-color' as string]: style.color }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <span className="chip-ico" style={{ background: style.color }}>
        {iconBody}
      </span>
      {category.name}
    </Tag>
  );
}
