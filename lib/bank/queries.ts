/** Query contracts shared by bank-account server actions and unit tests. */
export const ACTIVE_BANK_ACCOUNT_WHERE = {
  isActive: true,
  type: "BANK",
} as const;

export const ALL_BANK_ACCOUNT_WHERE = {
  type: "BANK",
} as const;
