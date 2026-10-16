export type UserStatus =
  "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "REJECTED";

export type PublicUser = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  roles: string[];
  avatarUrl?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  user: PublicUser;
};

export type RegisterRequest = {
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
};

export type RegisterResponse = {
  message: string;
  nextAction: "VERIFY_EMAIL";
  nextActionLabel: string;
  email: string;
};

export type VerifyEmailResponse = {
  message: string;
  userId: string;
  email: string;
  nextAction?: "SELECT_ROLE";
  nextActionLabel?: string;
  roles?: string[];
};

export type ResetPasswordRequest = {
  password: string;
  confirmPassword: string;
};

export type ClaimableRole = "BUYER" | "SUPPLIER" | "AGGREGATOR";

export type ClaimRoleRequest = {
  userId: string;
  role: ClaimableRole;
};

export type ClaimRoleResponse = {
  message: string;
  user: PublicUser;
};

export type MeLocation = {
  id: string;
  province: string | null;
  district: string | null;
  sector: string | null;
  cell: string | null;
  village: string | null;
  address: string | null;
  hood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export type RwandaLocationInput = {
  province: string;
  district: string;
  sector?: string;
  cell?: string;
  village?: string;
  address?: string;
  hood?: string;
  latitude?: number;
  longitude?: number;
};

export type MeProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  locationId: string | null;
  location: MeLocation | null;
  bio: string | null;
  ratingAverage: string;
  ratingCount: number;
  completedTransactions: number;
  createdAt: string;
  updatedAt: string;
};

export type MeBuyerProfile = {
  id: string;
  businessName: string;
  businessCategory: string;
  typicalWeeklyDemand: number | null;
  preferredPaymentMethod: string | null;
};

export type MeSupplierProfile = {
  id: string;
  farmName: string | null;
  estimatedLayers: number | null;
  averageWeeklyProduction: number | null;
  deliveryCapability: boolean;
  pickupAvailable: boolean;
  verificationStatus: string;
};

export type EstimatedVolumePeriod = "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";

export type EstimatedVolumeUnit = "TRAYS" | "EGGS";

export type EstimatedVolumeCustomUnit =
  "HOURS" | "DAYS" | "WEEKS" | "MONTHS" | "YEARS";

export type MeAggregatorProfile = {
  id: string;
  companyName: string;
  storageCapacity: number | null;
  estimatedVolume: number | null;
  estimatedVolumeUnit: EstimatedVolumeUnit | null;
  estimatedVolumePeriod: EstimatedVolumePeriod | null;
  estimatedVolumeCustomInterval: number | null;
  estimatedVolumeCustomUnit: EstimatedVolumeCustomUnit | null;
  supplierNetworkDescription: string | null;
  deliveryCapability: boolean;
  useMarketplaceLocation: boolean;
  locationId: string | null;
  location: MeLocation | null;
  verificationStatus: string;
};

export type UpdateMePersonalRequest = {
  firstName?: string;
  lastName?: string;
  phone?: string;
};

export type UpdateMeProfileRequest = {
  displayName?: string;
  avatarUrl?: string | null;
  businessName?: string | null;
  businessRegistrationNumber?: string | null;
  bio?: string | null;
  location?: RwandaLocationInput;
};

export type UpdateMeAggregatorProfileRequest = {
  companyName?: string;
  businessRegistrationNumber?: string | null;
  storageCapacity?: number | null;
  estimatedVolume?: number | null;
  estimatedVolumeUnit?: EstimatedVolumeUnit | null;
  estimatedVolumePeriod?: EstimatedVolumePeriod | null;
  estimatedVolumeCustomInterval?: number | null;
  estimatedVolumeCustomUnit?: EstimatedVolumeCustomUnit | null;
  supplierNetworkDescription?: string | null;
  deliveryCapability?: boolean;
  useMarketplaceLocation?: boolean;
  location?: RwandaLocationInput;
};

export type MeResponse = {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  phoneVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  roles: { id: string; name: string }[];
  profileId: string | null;
  profile: MeProfile | null;
  buyerProfileId: string | null;
  buyerProfile: MeBuyerProfile | null;
  supplierProfileId: string | null;
  supplierProfile: MeSupplierProfile | null;
  aggregatorProfileId: string | null;
  aggregatorProfile: MeAggregatorProfile | null;
  driverId: string | null;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type IncompleteRegistrationError = {
  message: string;
  error: string;
  missingAction: "VERIFY_EMAIL" | "SELECT_ROLE";
  missingActionLabel: string;
  userId?: string;
  email?: string;
};
