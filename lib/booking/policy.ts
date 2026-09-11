export interface HolidayState {
  isHoliday: boolean;
  reason?: string | null;
  openAt?: string | null;
}

export type PublicBookingAvailability =
  | { allowed: true }
  | {
      allowed: false;
      code: "GARAGE_CLOSED";
      error: string;
      holiday: {
        reason: string;
        openAt: string;
      };
    };

/**
 * Evaluates whether the public booking channel may accept a new booking.
 * Internal orders do not use this policy.
 */
export function getPublicBookingAvailability(
  holiday: HolidayState,
): PublicBookingAvailability {
  if (!holiday.isHoliday) {
    return { allowed: true };
  }

  const reason = holiday.reason?.trim() || "";
  const openAt = holiday.openAt?.trim() || "";
  const reasonText = reason ? `: ${reason}` : "";
  const openAtText = openAt ? ` Bengkel buka kembali: ${openAt}.` : "";

  return {
    allowed: false,
    code: "GARAGE_CLOSED",
    error: `Bengkel sedang libur/tutup${reasonText}.${openAtText} Silakan coba lagi nanti.`,
    holiday: { reason, openAt },
  };
}
