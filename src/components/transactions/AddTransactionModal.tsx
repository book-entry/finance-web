import { useEffect } from 'react';
import {
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Select,
  message,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useAccounts } from '../../hooks/queries/useAccounts';
import { useCategories } from '../../hooks/queries/useCategories';
import { useCreateTransaction } from '../../hooks/queries/useTransactions';
import type { EntryType } from '../../api/transactions';
import { ApiError } from '../../api/types';

type AddTransactionModalProps = {
  open: boolean;
  onClose: () => void;
  defaultAccountId?: string | null;
};

type FormValues = {
  accountId: string;
  entryType: EntryType;
  amount: number;
  currency: string;
  transactionDate: Dayjs;
  description?: string;
  reference?: string;
  categoryId?: string | undefined;
};

const TYPE_LABELS: { label: string; value: EntryType }[] = [
  { label: 'Spend', value: 'DEBIT' },
  { label: 'Income', value: 'CREDIT' },
];

export function AddTransactionModal({
  open,
  onClose,
  defaultAccountId,
}: AddTransactionModalProps) {
  const [form] = Form.useForm<FormValues>();
  const accounts = useAccounts();
  const categories = useCategories();
  const create = useCreateTransaction();
  const submitting = create.isPending;

  useEffect(() => {
    if (!open) return;
    const fallback = accounts.data?.[0];
    form.setFieldsValue({
      accountId: defaultAccountId ?? fallback?.accountId,
      entryType: 'DEBIT',
      amount: undefined as unknown as number,
      currency: fallback?.currency ?? 'HKD',
      transactionDate: dayjs(),
      description: '',
      reference: '',
      categoryId: undefined,
    });
  }, [open, defaultAccountId, accounts.data, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      await create.mutateAsync({
        accountId: values.accountId,
        entryType: values.entryType,
        amount: values.amount,
        currency: values.currency,
        transactionDate: values.transactionDate.format('YYYY-MM-DD'),
        description: values.description?.trim() || undefined,
        reference: values.reference?.trim() || undefined,
        categoryId: values.categoryId || undefined,
      });
      message.success('Transaction added');
      form.resetFields();
      onClose();
    } catch (err) {
      const text = err instanceof ApiError ? err.message : 'Could not save.';
      message.error(text);
    }
  };

  const noAccounts = accounts.data && accounts.data.length === 0;

  return (
    <Modal
      open={open}
      title="Add transaction"
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText={submitting ? 'Saving…' : 'Save transaction'}
      okButtonProps={{ loading: submitting, disabled: noAccounts }}
      destroyOnHidden
      width={560}
    >
      {noAccounts ? (
        <p style={{ color: 'var(--text-dim)' }}>
          Add an account first from the Accounts page — every transaction must
          belong to one.
        </p>
      ) : (
        <Form<FormValues>
          form={form}
          layout="vertical"
          preserve={false}
          requiredMark="optional"
        >
          <Form.Item label="Account" name="accountId" rules={[{ required: true }]}>
            <Select
              loading={accounts.isLoading}
              placeholder="Pick an account"
              options={(accounts.data ?? []).map((a) => ({
                value: a.accountId,
                label: `${a.bankName} · ${a.accountName}`,
              }))}
              onChange={(value) => {
                const acct = accounts.data?.find((a) => a.accountId === value);
                if (acct) form.setFieldValue('currency', acct.currency);
              }}
            />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 14 }}>
            <Form.Item label="Type" name="entryType" rules={[{ required: true }]}>
              <Segmented options={TYPE_LABELS} block />
            </Form.Item>
            <Form.Item
              label="Amount"
              name="amount"
              rules={[
                { required: true, message: 'Required' },
                {
                  validator: (_, value) =>
                    typeof value === 'number' && value > 0
                      ? Promise.resolve()
                      : Promise.reject(new Error('Must be greater than 0')),
                },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                step={1}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
            <Form.Item label="Currency" name="currency" rules={[{ required: true, len: 3 }]}>
              <Input maxLength={3} />
            </Form.Item>
          </div>

          <Form.Item label="Date" name="transactionDate" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item label="Merchant / what was it for" name="description">
            <Input placeholder="ParknShop, Salary, Netflix…" />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
            <Form.Item label="Category" name="categoryId">
              <Select
                loading={categories.isLoading}
                allowClear
                placeholder="Uncategorized"
                options={(categories.data ?? []).map((c) => ({
                  value: c.categoryId,
                  label: c.name,
                }))}
              />
            </Form.Item>
            <Form.Item label="Reference (optional)" name="reference">
              <Input placeholder="HSBC ref / invoice no." />
            </Form.Item>
          </div>
        </Form>
      )}
    </Modal>
  );
}
