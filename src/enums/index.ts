export enum USER_ROLES {
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
  USER = "USER",
}

export enum ACCOUNT_STATUS {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  DELETED = "deleted",
}

export enum OTP_PURPOSE {
  VERIFY_EMAIL = "email_verify",
  VERIFY_PHONE = "phone_verify",
  FORGOT_PASSWORD = "forgot_password",
  DELETE_ACCOUNT = "delete_account",
  RECOVERY_ACCOUNT = "recovery_account",
}
