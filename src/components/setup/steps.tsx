"use client";

import { PasswordInput, SegmentedControl, Stack, Switch, Text, TextInput } from "@mantine/core";
import { SECURITY } from "../../config/constants";
import type { SetupDraft } from "../../domain/setup-wizard";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = {
  draft: SetupDraft;
  onChange: (patch: Partial<SetupDraft>) => void;
  locale: UiLocale;
  showErrors: boolean;
};

function requiredError(ok: boolean, show: boolean, copy: (k: string) => string): string | undefined {
  return show && !ok ? copy("setup.error.required") : undefined;
}

export function LocaleStep({ draft, onChange, locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Stack gap="md">
      <SegmentedControl
        fullWidth
        value={draft.locale}
        onChange={(value) => onChange({ locale: value as SetupDraft["locale"] })}
        data={[
          { value: "fa-IR", label: t("locale.fa") },
          { value: "en-IR", label: t("locale.en") },
        ]}
        aria-label={t("setup.locale.label")}
        radius="md"
        size="md"
      />
      <Text size="sm" c="dimmed">
        {t("setup.locale.hint")}
      </Text>
    </Stack>
  );
}

export function StoreStep({ draft, onChange, locale, showErrors }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Stack gap="md">
      <TextInput
        label={t("setup.store.name")}
        required
        value={draft.store_name}
        onChange={(event) => onChange({ store_name: event.currentTarget.value })}
        error={requiredError(Boolean(draft.store_name.trim()), showErrors, t)}
        radius="md"
        size="md"
        data-testid="setup.store.name"
      />
      <TextInput
        label={t("setup.store.nameFa")}
        required
        value={draft.store_name_fa}
        onChange={(event) => onChange({ store_name_fa: event.currentTarget.value })}
        error={requiredError(Boolean(draft.store_name_fa.trim()), showErrors, t)}
        radius="md"
        size="md"
        data-testid="setup.store.nameFa"
      />
      <TextInput
        label={t("setup.store.city")}
        required
        value={draft.city}
        onChange={(event) => onChange({ city: event.currentTarget.value })}
        error={requiredError(Boolean(draft.city.trim()), showErrors, t)}
        radius="md"
        size="md"
        data-testid="setup.store.city"
      />
    </Stack>
  );
}

export function OperatorStep({ draft, onChange, locale, showErrors }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const emailOk = draft.operator_email.includes("@");
  const passwordOk = draft.operator_password.length >= SECURITY.PASSWORD_MIN_LENGTH;
  return (
    <Stack gap="md">
      <TextInput
        label={t("setup.operator.name")}
        required
        value={draft.operator_name}
        onChange={(event) => onChange({ operator_name: event.currentTarget.value })}
        error={requiredError(Boolean(draft.operator_name.trim()), showErrors, t)}
        radius="md"
        size="md"
        data-testid="setup.operator.name"
      />
      <TextInput
        label={t("setup.operator.email")}
        type="email"
        required
        value={draft.operator_email}
        onChange={(event) => onChange({ operator_email: event.currentTarget.value })}
        error={
          showErrors && !emailOk
            ? draft.operator_email
              ? t("setup.error.email")
              : t("setup.error.required")
            : undefined
        }
        radius="md"
        size="md"
        data-testid="setup.operator.email"
      />
      <PasswordInput
        label={t("setup.operator.password")}
        description={t("setup.operator.passwordHint")}
        required
        value={draft.operator_password}
        onChange={(event) => onChange({ operator_password: event.currentTarget.value })}
        error={
          showErrors && !passwordOk
            ? draft.operator_password
              ? t("setup.error.password")
              : t("setup.error.required")
            : undefined
        }
        radius="md"
        size="md"
        data-testid="setup.operator.password"
      />
    </Stack>
  );
}

export function PaymentsStep({ draft, onChange, locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  return (
    <Stack gap="md">
      <TextInput
        label={t("setup.payments.merchant")}
        description={t("setup.payments.merchantHint")}
        value={draft.zarinpal_merchant_id}
        onChange={(event) => onChange({ zarinpal_merchant_id: event.currentTarget.value })}
        radius="md"
        size="md"
        data-testid="setup.payments.merchant"
      />
      <Switch
        label={t("setup.payments.sandbox")}
        description={t("setup.payments.sandboxHint")}
        checked={draft.sandbox}
        onChange={(event) => onChange({ sandbox: event.currentTarget.checked })}
        size="md"
        data-testid="setup.payments.sandbox"
      />
      <TextInput
        label={t("setup.payments.enamad")}
        description={t("setup.payments.enamadHint")}
        value={draft.enamad_code}
        onChange={(event) => onChange({ enamad_code: event.currentTarget.value })}
        radius="md"
        size="md"
        data-testid="setup.payments.enamad"
      />
    </Stack>
  );
}

export function ReviewStep({ draft, locale }: { draft: SetupDraft; locale: UiLocale }) {
  const t = (key: string) => uiCopy(locale, key);
  const rows: { label: string; value: string }[] = [
    { label: t("setup.step.locale"), value: draft.locale },
    { label: t("setup.store.name"), value: draft.store_name },
    { label: t("setup.store.nameFa"), value: draft.store_name_fa },
    { label: t("setup.store.city"), value: draft.city },
    { label: t("setup.operator.name"), value: draft.operator_name },
    { label: t("setup.operator.email"), value: draft.operator_email },
    { label: t("setup.payments.sandbox"), value: draft.sandbox ? "✓" : "—" },
    { label: t("setup.payments.merchant"), value: draft.zarinpal_merchant_id || "—" },
    { label: t("setup.payments.enamad"), value: draft.enamad_code || "—" },
  ];
  return (
    <Stack gap="md">
      <Text size="sm" c="dimmed">
        {t("setup.review.hint")}
      </Text>
      <Stack gap="xs" data-testid="setup.review.summary">
        {rows.map((row) => (
          <Text key={row.label} size="sm">
            <Text span fw={600}>
              {row.label}:{" "}
            </Text>
            <Text span>{row.value}</Text>
          </Text>
        ))}
      </Stack>
    </Stack>
  );
}
