import { useEffect } from 'react';
import { ColorPicker, Form, Input, Modal, message } from 'antd';
import type { Category } from '../../api/categories';
import {
  useCreateCategory,
  useUpdateCategory,
} from '../../hooks/queries/useCategories';
import { ApiError } from '../../api/types';
import { styleForCategory } from '../../lib/categoryStyles';

type CategoryFormModalProps = {
  open: boolean;
  category: Category | null;
  onClose: () => void;
};

type FormValues = {
  name: string;
  colourHex: string;
};

export function CategoryFormModal({ open, category, onClose }: CategoryFormModalProps) {
  const [form] = Form.useForm<FormValues>();
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const isEdit = !!category;
  const submitting = create.isPending || update.isPending;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      name: category?.name ?? '',
      colourHex:
        category?.colourHex ?? (category ? styleForCategory(category).color : '#818CF8'),
    });
  }, [open, category, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    const colourHex = normaliseHex(values.colourHex);
    try {
      if (category) {
        await update.mutateAsync({
          id: category.categoryId,
          input: { name: values.name.trim(), colourHex },
        });
        message.success('Category updated');
      } else {
        await create.mutateAsync({ name: values.name.trim(), colourHex });
        message.success('Category created');
      }
      onClose();
    } catch (err) {
      const text = friendlyError(err);
      message.error(text);
    }
  };

  return (
    <Modal
      open={open}
      title={isEdit ? 'Rename category' : 'New category'}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText={
        submitting ? (isEdit ? 'Saving…' : 'Creating…') : isEdit ? 'Save' : 'Create'
      }
      okButtonProps={{ loading: submitting }}
      destroyOnHidden
      width={420}
    >
      <Form<FormValues> form={form} layout="vertical" preserve={false}>
        <Form.Item
          label="Name"
          name="name"
          rules={[
            { required: true, message: 'Give the category a name' },
            { max: 100, message: 'Maximum 100 characters' },
          ]}
        >
          <Input autoFocus placeholder="Groceries, Dining, Subscriptions…" />
        </Form.Item>
        <Form.Item
          label="Colour"
          name="colourHex"
          getValueFromEvent={(value) => {
            if (typeof value === 'string') return value;
            if (value && typeof value.toHexString === 'function') {
              return value.toHexString();
            }
            return value;
          }}
        >
          <ColorPicker format="hex" disabledAlpha />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function normaliseHex(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.startsWith('#') ? value : `#${value}`;
  return v.length === 4
    ? `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toLowerCase()
    : v.toLowerCase();
}

function friendlyError(err: unknown): string {
  if (!(err instanceof ApiError)) return 'Something went wrong.';
  switch (err.code) {
    case 'CATEGORY_NAME_CONFLICT':
      return 'A category with that name already exists.';
    case 'INVALID_CATEGORY_REQUEST':
    case 'VAL_001':
      return 'Check the form values and try again.';
    case 'CATEGORY_NOT_FOUND':
      return 'That category was deleted by another tab. Refresh and retry.';
    default:
      return err.message;
  }
}
