import { Dropdown, type MenuProps } from 'antd';
import type { Category } from '../../api/categories';
import { styleForCategory } from '../../lib/categoryStyles';
import { usePrefsStore } from '../../stores/prefsStore';
import { Icon } from '../icons/Icon';

type CategoryCardProps = {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
};

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const chipStyle = usePrefsStore((s) => s.chipStyle);
  const style = styleForCategory(category);

  const menuItems: MenuProps['items'] = [
    { key: 'edit', label: 'Rename / recolour' },
    { key: 'delete', label: <span style={{ color: 'var(--danger)' }}>Delete</span> },
  ];

  const handleMenu: MenuProps['onClick'] = ({ key, domEvent }) => {
    domEvent.stopPropagation();
    if (key === 'edit') onEdit(category);
    if (key === 'delete') onDelete(category);
  };

  return (
    <button
      type="button"
      className="cat-card"
      style={{ ['--cat-color' as string]: style.color }}
      onClick={() => onEdit(category)}
    >
      <div className="cat-top">
        <span className="cat-tile">
          {chipStyle === 'emoji' ? (
            <span style={{ fontSize: 16 }}>{style.emoji}</span>
          ) : chipStyle === 'dot' ? null : (
            style.glyph
          )}
        </span>
        <div>
          <div className="cat-name">{category.name}</div>
          <div className="cat-count">Pending transactions tally</div>
        </div>
        <div
          className="cat-actions"
          onClick={(e) => e.stopPropagation()}
          role="presentation"
        >
          <Dropdown
            menu={{ items: menuItems, onClick: handleMenu }}
            trigger={['click']}
            placement="bottomRight"
          >
            <span
              role="button"
              tabIndex={0}
              aria-label="Category actions"
              className="cat-action-btn"
              onClick={(e) => e.stopPropagation()}
            >
              ⋯
            </span>
          </Dropdown>
        </div>
      </div>
      <div className="cat-bottom">
        <span className="cat-eyebrow">SPENT</span>
        <span className="cat-amount">—</span>
      </div>
    </button>
  );
}

export function NewCategoryCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="new-cat-card" onClick={onClick}>
      <span className="plus-tile">
        <Icon.Plus />
      </span>
      <span className="title">New category</span>
    </button>
  );
}
