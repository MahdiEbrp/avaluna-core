"use client";

import {
  Accordion,
  Card,
  Code,
  CopyButton,
  DataList,
  SimpleGrid,
  Stack,
  Stepper,
  Table,
  Tabs,
  Text,
  ThemeIcon,
  Timeline,
  Title,
  Button,
  NumberFormatter,
  Badge,
} from "@mantine/core";
import { API, IRAN, MONEY, TAX, UI } from "../../config/constants";
import type { UiLocale } from "../../domain/ui-locale";
import { uiCopy } from "../../lib/locale/ui-copy";

type Props = { locale: UiLocale };

export function LandingSections({ locale }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const toman = MONEY.SAMPLE_ORDER_RIAL / IRAN.RIALS_PER_TOMAN;
  const vatPercent = TAX.DEFAULT_RATE_BPS / (TAX.BPS_DENOMINATOR / UI.PERCENT_MAX);
  return (
    <Stack gap="xl">
      <Stack id="features" gap="md">
        <Title order={2}>{t("features.title")}</Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          {(["catalog", "pay", "ops"] as const).map((id) => (
            <Card key={id} withBorder padding="lg" radius={UI.MANTINE_RADIUS}>
              <ThemeIcon variant="light" radius={UI.MANTINE_RADIUS}>
                {id === "catalog" ? "1" : id === "pay" ? "2" : "3"}
              </ThemeIcon>
              <Title order={3} mt="sm">
                {t(`features.${id}.title`)}
              </Title>
              <Text mt="xs">{t(`features.${id}.body`)}</Text>
            </Card>
          ))}
        </SimpleGrid>
      </Stack>

      <Stack id="flow" gap="md">
        <Title order={2}>{t("flow.title")}</Title>
        <Stepper active={UI.STEPPER_CHECKOUT_LAST} allowNextStepsSelect={false}>
          <Stepper.Step label={t("step.cart")} />
          <Stepper.Step label={t("step.pay")} />
          <Stepper.Step label={t("step.done")} />
        </Stepper>
        <Timeline active={UI.STEPPER_CHECKOUT_LAST} bulletSize={UI.TIMELINE_BULLET}>
          <Timeline.Item title={t("flow.cart")} />
          <Timeline.Item title={t("flow.pay")} />
          <Timeline.Item title={t("flow.stock")} />
          <Timeline.Item title={t("flow.ship")} />
        </Timeline>
        <Tabs defaultValue="shop">
          <Tabs.List>
            <Tabs.Tab value="shop">{t("tabs.shop")}</Tabs.Tab>
            <Tabs.Tab value="pay">{t("tabs.pay")}</Tabs.Tab>
            <Tabs.Tab value="ops">{t("tabs.ops")}</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="shop" pt="md">
            {t("tabs.shop.body")}
          </Tabs.Panel>
          <Tabs.Panel value="pay" pt="md">
            {t("tabs.pay.body")}
          </Tabs.Panel>
          <Tabs.Panel value="ops" pt="md">
            {t("tabs.ops.body")}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Stack id="money" gap="md">
        <Title order={2}>{t("money.title")}</Title>
        <Badge variant="light">{t("status.processing")}</Badge>
        <Table>
          <Table.Tbody>
            <Table.Tr>
              <Table.Td>{t("money.rial")}</Table.Td>
              <Table.Td>
                <NumberFormatter value={MONEY.SAMPLE_ORDER_RIAL} thousandSeparator /> {IRAN.CURRENCY}
              </Table.Td>
            </Table.Tr>
            <Table.Tr>
              <Table.Td>{t("money.toman")}</Table.Td>
              <Table.Td>
                <NumberFormatter value={toman} thousandSeparator />
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        <DataList>
          <DataList.Item>
            <DataList.ItemLabel>{t("money.vat")}</DataList.ItemLabel>
            <DataList.ItemValue>
              <NumberFormatter value={vatPercent} suffix="%" decimalScale={0} />
            </DataList.ItemValue>
          </DataList.Item>
        </DataList>
      </Stack>

      <Stack id="api" gap="md">
        <Title order={2}>{t("api.title")}</Title>
        <Code block>{API.SERVICES_PREFIX}</Code>
        <CopyButton value={API.STOREFRONT_PREFIX}>
          {({ copy }) => (
            <Button variant="default" onClick={copy}>
              {t("api.copy")}
            </Button>
          )}
        </CopyButton>
      </Stack>

      <Stack id="faq" gap="md">
        <Title order={2}>{t("faq.title")}</Title>
        <Accordion>
          <Accordion.Item value="ui">
            <Accordion.Control>{t("faq.ui.q")}</Accordion.Control>
            <Accordion.Panel>{t("faq.ui.a")}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="lang">
            <Accordion.Control>{t("faq.lang.q")}</Accordion.Control>
            <Accordion.Panel>{t("faq.lang.a")}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="tax">
            <Accordion.Control>{t("faq.tax.q")}</Accordion.Control>
            <Accordion.Panel>{t("faq.tax.a")}</Accordion.Panel>
          </Accordion.Item>
        </Accordion>
        <Text size="sm" c="dimmed">
          {t("footer.legal")}
        </Text>
      </Stack>
    </Stack>
  );
}
