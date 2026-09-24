"use client";

import {
  ActionIcon,
  Alert,
  Button,
  Center,
  CopyButton,
  Group,
  List,
  Paper,
  Progress,
  Stack,
  Stepper,
  Text,
  Title,
} from "@mantine/core";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { API, SETUP, UI } from "../../config/constants";
import {
  canAdvanceSetup,
  emptySetupDraft,
  setupProgressPercent,
  type SetupDraft,
} from "../../domain/setup-wizard";
import { UI_LOCALE_COOKIE, type UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";
import { LocaleStep, OperatorStep, PaymentsStep, ReviewStep, StoreStep } from "./steps";

type Props = { locale: UiLocale };

type SetupSuccess = { key_id: string; key_secret: string };

type ApiFailure = { code: string; message: string; message_fa: string | null };

function parseFailure(body: unknown): ApiFailure | null {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;
    if (error && typeof error === "object" && "code" in error) {
      const e = error as { code?: unknown; message?: unknown; message_fa?: unknown };
      return {
        code: String(e.code ?? ""),
        message: String(e.message ?? ""),
        message_fa: e.message_fa === null || e.message_fa === undefined ? null : String(e.message_fa),
      };
    }
  }
  return null;
}

function setLocaleCookie(ui: UiLocale) {
  document.cookie = `${UI_LOCALE_COOKIE}=${ui}; path=/; samesite=lax`;
}

function SuccessKeys({ locale, success }: { locale: UiLocale; success: SetupSuccess }) {
  const t = (key: string) => uiCopy(locale, key);
  const rows = [
    { label: t("setup.success.keyId"), value: success.key_id, testid: "setup.key.id" },
    { label: t("setup.success.keySecret"), value: success.key_secret, testid: "setup.key.secret" },
  ];
  return (
    <Stack gap="md" data-testid="setup.success">
      <Title order={2}>{t("setup.success.title")}</Title>
      <Alert color="green" title={t("setup.success.title")}>
        {t("setup.success.lede")}
      </Alert>
      <List spacing="sm">
        {rows.map((row) => (
          <List.Item key={row.testid} data-testid={row.testid}>
            <Group justify="space-between" wrap="nowrap" gap="sm">
              <Stack gap={0} className="setup-key-meta">
                <Text size="xs" c="dimmed">
                  {row.label}
                </Text>
                <Text fw={600} className="setup-key-value">
                  {row.value}
                </Text>
              </Stack>
              <CopyButton value={row.value} timeout={2000}>
                {({ copied, copy }) => (
                  <ActionIcon
                    variant={copied ? "light" : "default"}
                    size="lg"
                    radius="md"
                    onClick={copy}
                    aria-label={copied ? t("setup.copied") : t("setup.copy")}
                    title={copied ? t("setup.copied") : t("setup.copy")}
                  >
                    <Text size="xs" fw={700}>
                      {copied ? t("setup.copied") : t("setup.copy")}
                    </Text>
                  </ActionIcon>
                )}
              </CopyButton>
            </Group>
          </List.Item>
        ))}
      </List>
      <Button component="a" href="/" size="md" radius="md" data-testid="setup.cta">
        {t("setup.success.cta")}
      </Button>
    </Stack>
  );
}

export function SetupWizard({ locale: initialLocale }: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<SetupDraft>(() => emptySetupDraft());
  const [step, setStep] = useState<number>(SETUP.FIRST_STEP);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<SetupSuccess | null>(null);
  const locale: UiLocale = draft.locale === "en-IR" ? "en" : initialLocale;
  const t = (key: string) => uiCopy(locale, key);
  const canAdvance = canAdvanceSetup(step, draft);
  const percent = setupProgressPercent(step);

  function patch(next: Partial<SetupDraft>) {
    setDraft((prev) => ({ ...prev, ...next }));
    setShowErrors(false);
    if (next.locale) {
      const ui: UiLocale = next.locale === "en-IR" ? "en" : "fa";
      setLocaleCookie(ui);
      router.refresh();
    }
  }

  function goNext() {
    if (!canAdvanceSetup(step, draft)) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setFailure(null);
    setStep((prev) => Math.min(SETUP.LAST_STEP, prev + 1));
  }

  function goBack() {
    setShowErrors(false);
    setFailure(null);
    setStep((prev) => Math.max(SETUP.FIRST_STEP, prev - 1));
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    setFailure(null);
    try {
      const response = await fetch(`${API.SERVICES_PREFIX}/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const body: unknown = await response.json().catch(() => null);
      if (response.status === 409) {
        setFailure(t("setup.alreadyDone"));
        return;
      }
      if (!response.ok) {
        const parsed = parseFailure(body);
        const message =
          locale === "fa"
            ? parsed?.message_fa || parsed?.message || t("setup.error.network")
            : parsed?.message || t("setup.error.network");
        setFailure(message);
        return;
      }
      const data = body as { key_id?: string; key_secret?: string };
      setSuccess({ key_id: data.key_id ?? "", key_secret: data.key_secret ?? "" });
    } catch {
      setFailure(t("setup.error.network"));
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Center maw={UI.PAGE_MAX} py="xl" px="md">
        <Paper withBorder p="lg" radius="md" w="100%" shadow="sm">
          <SuccessKeys locale={locale} success={success} />
        </Paper>
      </Center>
    );
  }

  const stepProps = { draft, onChange: patch, locale, showErrors } as const;

  return (
    <Center maw={UI.PAGE_MAX} py="xl" px="md" data-testid="setup.wizard">
      <Paper withBorder p="lg" radius="md" w="100%" shadow="sm">
        <Stack gap="md">
          <div>
            <Title order={1} mb={4}>
              {t("setup.title")}
            </Title>
            <Text size="sm" c="dimmed">
              {t("setup.subtitle")}
            </Text>
          </div>
          <div aria-live="polite" data-testid="setup.progress">
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">
                {t("setup.progress")}
              </Text>
              <Text size="xs" fw={600}>
                {percent}%
              </Text>
            </Group>
            <Progress value={percent} size="sm" radius="xl" />
          </div>
          <Stepper
            active={step}
            orientation="vertical"
            allowNextStepsSelect={false}
            onStepClick={(next) => {
              if (next < step) {
                setStep(next);
                setShowErrors(false);
              }
            }}
            completedIcon={<Text size="xs">✓</Text>}
            color="brand"
          >
            <Stepper.Step label={t("setup.step.locale")} description={t("setup.locale.label")}>
              <LocaleStep {...stepProps} />
            </Stepper.Step>
            <Stepper.Step label={t("setup.step.store")} description={t("setup.store.name")}>
              <StoreStep {...stepProps} />
            </Stepper.Step>
            <Stepper.Step label={t("setup.step.operator")} description={t("setup.operator.email")}>
              <OperatorStep {...stepProps} />
            </Stepper.Step>
            <Stepper.Step label={t("setup.step.payments")} description={t("setup.payments.merchant")}>
              <PaymentsStep {...stepProps} />
            </Stepper.Step>
            <Stepper.Step label={t("setup.step.review")} description={t("setup.review.heading")}>
              <ReviewStep draft={draft} locale={locale} />
            </Stepper.Step>
          </Stepper>
          {failure ? (
            <Alert color="red" title={t("error.title")} data-testid="setup.error">
              {failure}
            </Alert>
          ) : null}
          <Group justify="space-between" mt="md">
            <Button
              variant="default"
              size="md"
              radius="md"
              disabled={step === SETUP.FIRST_STEP || submitting}
              onClick={goBack}
              data-testid="setup.back"
            >
              {t("setup.back")}
            </Button>
            {step === SETUP.LAST_STEP ? (
              <Button size="md" radius="md" loading={submitting} onClick={submit} data-testid="setup.submit">
                {t("setup.submit")}
              </Button>
            ) : (
              <Button size="md" radius="md" onClick={goNext} data-testid="setup.next">
                {t("setup.next")}
              </Button>
            )}
          </Group>
          {!canAdvance && step !== SETUP.LAST_STEP ? (
            <Text size="xs" c="dimmed" data-testid="setup.blocked">
              {t("setup.error.required")}
            </Text>
          ) : null}
        </Stack>
      </Paper>
    </Center>
  );
}
