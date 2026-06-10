import { Form, Input, InputNumber, Modal, Select, message } from 'antd';
import { useCreateAccount } from '../../hooks/queries/useAccounts';
import type { AccountType, CreateAccountInput } from '../../api/accounts';
import { ApiError } from '../../api/types';

type LinkAccountModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

type FormValues = {
  accountName: string;
  bankName: string;
  accountType: AccountType;
  currency: string;
  accountCode?: string;
  openingBalance?: number;
  description?: string;
};

const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string; hint: string }[] = [
  { value: 'ASSET', label: 'Asset', hint: 'Cash, checking, savings, e-wallet' },
  { value: 'LIABILITY', label: 'Liability', hint: 'Credit card, loan, mortgage' },
  { value: 'EQUITY', label: 'Equity', hint: 'Owner capital' },
  { value: 'EXPENSE', label: 'Expense', hint: 'Expense account' },
  { value: 'REVENUE', label: 'Revenue', hint: 'Income account' },
];

const CURRENCY_OPTIONS = ['HKD', 'USD', 'CNY', 'EUR', 'GBP', 'SGD', 'JPY', 'AUD'];

export function LinkAccountModal({ open, onClose, onCreated }: LinkAccountModalProps) {
  const [form] = Form.useForm<FormValues>();
  const { mutateAsync, isPending } = useCreateAccount();

  const handleOk = async () => {
    const values = await form.validateFields();
    const input: CreateAccountInput = {
      accountName: values.accountName.trim(),
      bankName: values.bankName.trim(),
      accountType: values.accountType,
      currency: values.currency,
      accountCode: values.accountCode?.trim() || undefined,
      openingBalance: values.openingBalance ?? 0,
      description: values.description?.trim() || undefined,
    };
    try {
      await mutateAsync(input);
      message.success('Account added');
      form.resetFields();
      onCreated?.();
      onClose();
    } catch (err) {
      const text =
        err instanceof ApiError
          ? err.message
          : 'Could not create the account.';
      message.error(text);
    }
  };

  return (
    <Modal
      open={open}
      title="Add a new account"
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      okText={isPending ? 'Adding…' : 'Add account'}
      okButtonProps={{ loading: isPending }}
      destroyOnHidden
      width={520}
    >
      <Form<FormValues>
        form={form}
        layout="vertical"
        preserve={false}
        initialValues={{
          accountType: 'ASSET',
          currency: 'HKD',
          openingBalance: 0,
        }}
        requiredMark="optional"
      >
        <Form.Item
          label="Bank"
          name="bankName"
          rules={[{ required: true, message: 'Bank name is required' }]}
        >
          <Input placeholder="HSBC, Standard Chartered, AlipayHK …" maxLength={255} />
        </Form.Item>

        <Form.Item
          label="Account name"
          name="accountName"
          rules={[{ required: true, message: 'Give the account a memorable name' }]}
        >
          <Input placeholder="HSBC One" maxLength={255} />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
          <Form.Item
            label="Account type"
            name="accountType"
            rules={[{ required: true }]}
          >
            <Select
              options={ACCOUNT_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: (
                  <span>
                    <strong>{o.label}</strong>{' '}
                    <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                      · {o.hint}
                    </span>
                  </span>
                ),
              }))}
            />
          </Form.Item>
          <Form.Item
            label="Currency"
            name="currency"
            rules={[{ required: true, len: 3, message: 'ISO 4217 code' }]}
          >
            <Select options={CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
        </div>

        <Form.Item
          label="Account number / card / reference (optional)"
          name="accountCode"
          extra="Free text — card number, IBAN, anything. Used to show the last 4 digits on the card."
        >
          <Input placeholder="•••• •••• •••• 8842" />
        </Form.Item>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Form.Item label="Opening balance" name="openingBalance">
            <InputNumber
              style={{ width: '100%' }}
              step={100}
              precision={2}
              placeholder="0.00"
            />
          </Form.Item>
          <Form.Item label="Description (optional)" name="description">
            <Input placeholder="Joint household account" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
