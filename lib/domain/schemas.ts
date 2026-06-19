import { z } from "zod";

import {
  BORROW_APPROVAL_DECISIONS,
  BORROW_WORKFLOW_STATUSES,
  CHECKLIST_OPTIONS,
  CONTACT_CHANNEL_TYPES,
  DELIVERY_STATUSES,
  EQUIPMENT_STATUSES,
  EQUIPMENT_TYPES,
  LINE_NOTIFICATION_DELIVERY_STATUSES,
  LINE_NOTIFICATION_TRIGGERS,
  MEDIA_ASSET_KINDS,
  RETURN_CONDITIONS,
  SELF_CARE_ABILITIES,
  WALKING_ABILITIES,
} from "./constants";

const nationalIdSchema = z
  .string()
  .trim()
  .regex(/^\d{13}$/, "National ID must be exactly 13 numeric digits.");

const thaiMobilePhoneSchema = z
  .string()
  .trim()
  .regex(/^0(?:6|8|9)\d{8}$/, "Phone number must be a valid Thai mobile number.");

const postalCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$/, "Postal code must be exactly 5 numeric digits.");

const optionalTextSchema = z.union([z.string().trim().min(1), z.literal("")]).optional();

const googleMapsUrlSchema = z
  .string()
  .trim()
  .url("Google Maps link must be a valid URL.")
  .refine(
    (value) => value.includes("google.com/maps") || value.includes("maps.app.goo.gl"),
    "Google Maps link must point to Google Maps.",
  );

const latitudeSchema = z.coerce.number().finite().min(-90).max(90);
const longitudeSchema = z.coerce.number().finite().min(-180).max(180);

export const thaiAddressLookupSchema = z.object({
  province: z.string().trim().min(1),
  district: z.string().trim().min(1),
  subdistrict: z.string().trim().min(1),
  postalCode: postalCodeSchema,
});

export const addressSchema = z.object({
  houseNumber: z.string().trim().min(1),
  moo: optionalTextSchema,
  province: z.string().trim().min(1),
  district: z.string().trim().min(1),
  subdistrict: z.string().trim().min(1),
  postalCode: postalCodeSchema,
});

export const locationSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  googleMapsUrl: googleMapsUrlSchema,
});

export const mediaAssetSchema = z.object({
  kind: z.enum(MEDIA_ASSET_KINDS),
  url: z.string().trim().url(),
  publicId: z.string().trim().min(1).optional(),
  altText: z.string().trim().min(1).optional(),
});

export const medicalAssessmentSchema = z.object({
  age: z.coerce.number().int().min(0).max(130),
  chronicDiseases: z.array(z.string().trim().min(1)).default([]),
  walkingAbility: z.enum(WALKING_ABILITIES),
  selfCareAbility: z.enum(SELF_CARE_ABILITIES),
  patientCondition: z.string().trim().min(1),
  urgencyLevel: z.string().trim().min(1),
  checklistAnswers: z.array(z.enum(CHECKLIST_OPTIONS)).min(1),
  supportingImages: z.array(mediaAssetSchema).default([]),
});

export const patientSchema = z.object({
  fullName: z.string().trim().min(1),
  nationalId: nationalIdSchema,
  dateOfBirth: z.coerce.date(),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.string().trim().min(1),
  phoneNumber: thaiMobilePhoneSchema,
  address: addressSchema,
  location: locationSchema,
  patientPhotos: z.array(mediaAssetSchema).default([]),
  homeEnvironmentPhotos: z.array(mediaAssetSchema).default([]),
  medicalAssessment: medicalAssessmentSchema,
});

export const equipmentStatusSchema = z.enum(EQUIPMENT_STATUSES);
export const equipmentTypeSchema = z.enum(EQUIPMENT_TYPES);
export const borrowWorkflowStatusSchema = z.enum(BORROW_WORKFLOW_STATUSES);
export const borrowApprovalDecisionSchema = z.enum(BORROW_APPROVAL_DECISIONS);
export const deliveryStatusSchema = z.enum(DELIVERY_STATUSES);
export const returnConditionSchema = z.enum(RETURN_CONDITIONS);

export const equipmentStatusHistoryEntrySchema = z.object({
  equipmentItemId: z.string().trim().min(1),
  fromStatus: equipmentStatusSchema,
  toStatus: equipmentStatusSchema,
  changedAt: z.coerce.date(),
  changedByUserId: z.string().trim().min(1).optional(),
  note: z.string().trim().min(1).optional(),
});

export const returnConditionHistoryEntrySchema = z.object({
  equipmentItemId: z.string().trim().min(1),
  condition: returnConditionSchema,
  inspectedAt: z.coerce.date(),
  inspectedByUserId: z.string().trim().min(1).optional(),
  damageNote: z.string().trim().min(1).optional(),
  photo: mediaAssetSchema,
}).superRefine((value, ctx) => {
  if (value.condition === "ชำรุด" && !value.damageNote) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["damageNote"],
      message: "Damage note is required when the returned item is damaged.",
    });
  }
});

export const equipmentItemSchema = z.object({
  equipmentId: z.string().trim().min(1),
  equipmentCode: z.string().trim().min(1),
  assetNumber: z.string().trim().min(1),
  equipmentType: equipmentTypeSchema,
  receivedDate: z.coerce.date(),
  currentStatus: equipmentStatusSchema,
  currentLoanRequestId: z.string().trim().min(1).nullable().optional(),
  statusHistory: z.array(equipmentStatusHistoryEntrySchema).default([]),
  returnConditionHistory: z.array(returnConditionHistoryEntrySchema).default([]),
});

export const aiRecommendationSchema = z.object({
  equipmentType: equipmentTypeSchema,
  matchingScorePercentage: z.coerce.number().min(0).max(100),
  explanation: z.string().trim().min(1).optional(),
  rankingOrder: z.coerce.number().int().min(1),
});

export const aiRecommendationResultSchema = z.object({
  recommendations: z.array(aiRecommendationSchema).min(1),
  staffDecisionEquipmentType: equipmentTypeSchema.optional(),
  staffOverrideNote: z.string().trim().min(1).optional(),
});

export const lineContactChannelSchema = z.object({
  type: z.enum(CONTACT_CHANNEL_TYPES),
  value: z.string().trim().min(1),
});

export const lineNotificationSchema = z.object({
  contactChannel: lineContactChannelSchema,
  trigger: z.enum(LINE_NOTIFICATION_TRIGGERS),
  deliveryStatus: z.enum(LINE_NOTIFICATION_DELIVERY_STATUSES),
  message: z.string().trim().min(1),
  triggeredAt: z.coerce.date(),
  deliveredAt: z.coerce.date().optional().nullable(),
});

export const returnDataSchema = z
  .object({
    returnDate: z.coerce.date(),
    receivingStaffName: z.string().trim().min(1),
    equipmentPhoto: mediaAssetSchema,
    condition: returnConditionSchema,
    damageNote: z.string().trim().min(1).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.condition === "ชำรุด" && !value.damageNote) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["damageNote"],
        message: "Damage note is required when the returned item is damaged.",
      });
    }
  });

export const borrowingRequestSchema = z
  .object({
    requestId: z.string().trim().min(1),
    patientId: z.string().trim().min(1),
    requestedEquipmentType: equipmentTypeSchema,
    aiRecommendationResult: aiRecommendationResultSchema.optional(),
    assignedEquipmentItemId: z.string().trim().min(1).nullable().optional(),
    workflowStatus: borrowWorkflowStatusSchema,
    approvalDecision: borrowApprovalDecisionSchema.optional().nullable(),
    deliveryStatus: deliveryStatusSchema.optional().nullable(),
    dueOrReturnDate: z.coerce.date().optional().nullable(),
    returnData: returnDataSchema.optional().nullable(),
    notificationHistory: z.array(lineNotificationSchema).default([]),
  })
  .superRefine((value, ctx) => {
    const requiresAssignedItemStatuses: BorrowWorkflowStatus[] = [
      "อนุมัติ",
      "เตรียมจัดส่ง",
      "จัดส่งสำเร็จ",
      "รอคืน",
      "คืนอุปกรณ์",
      "ปิดรายการ",
    ];

    if (
      (requiresAssignedItemStatuses.includes(value.workflowStatus) ||
        value.approvalDecision === "อนุมัติ") &&
      !value.assignedEquipmentItemId
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["assignedEquipmentItemId"],
        message: "A serialized equipment item must be assigned before approval is completed.",
      });
    }
  });

export const patientLocationSummarySchema = z.object({
  patientId: z.string().trim().min(1),
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  googleMapsUrl: googleMapsUrlSchema,
  province: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).optional(),
  subdistrict: z.string().trim().min(1).optional(),
});

export type NationalId = z.infer<typeof nationalIdSchema>;
export type ThaiMobilePhone = z.infer<typeof thaiMobilePhoneSchema>;
export type ThaiAddressLookup = z.infer<typeof thaiAddressLookupSchema>;
export type Address = z.infer<typeof addressSchema>;
export type Location = z.infer<typeof locationSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MedicalAssessment = z.infer<typeof medicalAssessmentSchema>;
export type Patient = z.infer<typeof patientSchema>;
export type EquipmentStatus = z.infer<typeof equipmentStatusSchema>;
export type EquipmentType = z.infer<typeof equipmentTypeSchema>;
export type BorrowWorkflowStatus = z.infer<typeof borrowWorkflowStatusSchema>;
export type BorrowApprovalDecision = z.infer<typeof borrowApprovalDecisionSchema>;
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;
export type ReturnCondition = z.infer<typeof returnConditionSchema>;
export type EquipmentStatusHistoryEntry = z.infer<
  typeof equipmentStatusHistoryEntrySchema
>;
export type ReturnConditionHistoryEntry = z.infer<
  typeof returnConditionHistoryEntrySchema
>;
export type EquipmentItem = z.infer<typeof equipmentItemSchema>;
export type AIRecommendation = z.infer<typeof aiRecommendationSchema>;
export type AIRecommendationResult = z.infer<typeof aiRecommendationResultSchema>;
export type LineContactChannel = z.infer<typeof lineContactChannelSchema>;
export type LineNotification = z.infer<typeof lineNotificationSchema>;
export type ReturnData = z.infer<typeof returnDataSchema>;
export type BorrowingRequest = z.infer<typeof borrowingRequestSchema>;
export type PatientLocationSummary = z.infer<typeof patientLocationSummarySchema>;
