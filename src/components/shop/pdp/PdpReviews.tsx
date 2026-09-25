"use client";

import { Badge, Button, Group, NumberInput, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";
import { useState } from "react";
import { UI } from "../../../config/constants";
import type { UiLocale } from "../../../domain/ui-locale";
import { uiCopy } from "../../../lib/locale/ui-copy";
import type { PdpReview } from "../../../lib/services/pdp";
import { RatingStars } from "../RatingStars";

type Props = {
  locale: UiLocale;
  productId: number;
  reviews: PdpReview[];
};

async function postReview(body: Record<string, unknown>): Promise<boolean> {
  try {
    const response = await fetch("/api/storefront/v1/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function PdpReviews({ locale, productId, reviews }: Props) {
  const t = (key: string) => uiCopy(locale, key);
  const [pending, setPending] = useState(false);
  const form = useForm({
    initialValues: {
      reviewer: "",
      reviewer_email: "",
      review: "",
      rating: 5,
    },
    validate: {
      reviewer: (value) => (value.trim().length > 0 ? null : t("shop.pdp.reviewRequired")),
      reviewer_email: (value) => (/^\S+@\S+\.\S+$/.test(value) ? null : t("shop.pdp.reviewRequired")),
      review: (value) => (value.trim().length > 0 ? null : t("shop.pdp.reviewRequired")),
    },
  });

  async function handleSubmit(values: typeof form.values) {
    setPending(true);
    try {
      const ok = await postReview({ product_id: productId, ...values, rating: Number(values.rating) });
      if (ok) {
        form.reset();
        showNotification({ color: "green", title: t("shop.pdp.reviewPending"), message: null });
      } else {
        showNotification({ color: "red", title: t("shop.pdp.reviewFailed"), message: null });
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Stack gap="md" data-testid="pdp.reviews">
      <div className="shop-pdp__review-list" data-testid="pdp.reviews.list">
        {reviews.length === 0 ? (
          <Text c="dimmed" data-testid="pdp.reviews.empty">
            {t("shop.pdp.reviewsEmpty")}
          </Text>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="shop-pdp__review" data-testid={`pdp.review.${review.id}`}>
              <Group justify="space-between" gap="xs" wrap="wrap">
                <Text fw={600} size="sm">
                  {review.reviewer}
                </Text>
                <RatingStars locale={locale} average={review.rating} count={1} compact />
              </Group>
              <Text size="sm">{review.review}</Text>
              {review.verified ? (
                <Badge size="xs" variant="light" color="success">
                  {t("shop.pdp.reviewVerified")}
                </Badge>
              ) : null}
            </article>
          ))
        )}
      </div>

      <form
        onSubmit={form.onSubmit((values) => {
          void handleSubmit(values);
        })}
        className="shop-pdp__review-form"
        data-testid="pdp.review.form"
      >
        <Text fw={600} component="h3" className="shop-pdp__review-form-title">
          {t("shop.pdp.reviewFormTitle")}
        </Text>
        <TextInput
          label={t("shop.pdp.reviewName")}
          data-testid="pdp.review.name"
          maxLength={UI.PDP.REVIEW_NAME_MAX}
          {...form.getInputProps("reviewer")}
        />
        <TextInput
          label={t("shop.pdp.reviewEmail")}
          data-testid="pdp.review.email"
          maxLength={UI.PDP.REVIEW_EMAIL_MAX}
          {...form.getInputProps("reviewer_email")}
        />
        <Textarea
          label={t("shop.pdp.reviewBody")}
          data-testid="pdp.review.body"
          minRows={3}
          maxLength={UI.PDP.REVIEW_TEXT_MAX}
          {...form.getInputProps("review")}
        />
        <NumberInput
          label={t("shop.pdp.reviewRating")}
          data-testid="pdp.review.rating"
          min={1}
          max={5}
          step={1}
          {...form.getInputProps("rating")}
        />
        <Button type="submit" loading={pending} data-testid="pdp.review.submit">
          {t("shop.pdp.reviewSubmit")}
        </Button>
      </form>
    </Stack>
  );
}
