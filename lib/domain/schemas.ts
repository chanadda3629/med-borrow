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
  REJECTION_REASONS,
  RETURN_CONDITIONS,
  SELF_CARE_ABILITIES,
  URGENCY_LEVELS,
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
  reporterName: optionalTextSchema,
  address: addressSchema,
  location: locationSchema,
  patientPhotos: z.array(mediaAssetSchema).min(1).max(5),
  homeEnvironmentPhotos: z.array(mediaAssetSchema).min(1).max(5),
  medicalAssessment: medicalAssessmentSchema,
});

export const urgencyLevelSchema = z.enum(URGENCY_LEVELS);

// Per-request assessment ("ประเมินผู้ป่วย" stage): staff review the intake, record a
// preliminary finding, and prescribe one or more equipment types with quantities.
export const prescribedEquipmentItemSchema = z.object({
  equipmentType: z.enum(EQUIPMENT_TYPES),
  // Each prescribed equipment is a single unit; quantity is always 1.
  quantity: z.coerce.number().int().min(1).max(1),
});

export const assessmentFormSchema = z.object({
  assessorName: z.string().trim().min(1),
  assessedAt: z.coerce.date().optional(),
  patientCondition: z.string().trim().min(1),
  urgencyLevel: urgencyLevelSchema,
  assessmentSummary: z.string().trim().min(1),
  prescribedEquipment: z.array(prescribedEquipmentItemSchema).min(1).max(3),
  usageRecommendation: z.union([z.string().trim().min(1), z.literal("")]).optional(),
  equipmentNote: z.union([z.string().trim().min(1), z.literal("")]).optional(),
});

export const equipmentStatusSchema = z.enum(EQUIPMENT_STATUSES);
export const equipmentTypeSchema = z.enum(EQUIPMENT_TYPES);
export const borrowWorkflowStatusSchema = z.enum(BORROW_WORKFLOW_STATUSES);
export const borrowApprovalDecisionSchema = z.enum(BORROW_APPROVAL_DECISIONS);
export const deliveryStatusSchema = z.enum(DELIVERY_STATUSES);
export const returnConditionSchema = z.enum(RETURN_CONDITIONS);
export const rejectionReasonSchema = z.enum(REJECTION_REASONS);

// Approval decision ("ตรวจสอบคลังอุปกรณ์" stage): staff bind a serialized item and
// record who approved. Rejection instead records a reason from a fixed list.
export const approveRequestSchema = z.object({
  equipmentItemId: z.string().trim().min(1),
  approverName: z.string().trim().min(1),
});

export const rejectRequestSchema = z.object({
  rejectionReason: rejectionReasonSchema,
});

// "เตรียมจัดส่ง" stage: staff record the delivery plan for the approved item.
// deliveryContactPhone is the number the patient/family can call on delivery day;
// it rides into the delivery-completed LINE notification.
export const prepareDeliverySchema = z.object({
  requestDetail: z.union([z.string().trim().min(1), z.literal("")]).optional(),
  deliveryDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  delivererName: z.string().trim().min(1),
  deliveryContactPhone: thaiMobilePhoneSchema,
});

// "รอคืน" stage: staff record the active loan details after delivery is confirmed.
export const startReturnWaitingSchema = z.object({
  receivedDate: z.coerce.date(),
  receiverName: z.string().trim().min(1),
  delivererName: z.string().trim().min(1),
  loanDetail: z.union([z.string().trim().min(1), z.literal("")]).optional(),
});

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
  donorName: z.string().trim().min(1).optional(),
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
  // Staff may confirm 1–5 equipment types. staffDecisionEquipmentType (singular)
  // is kept for backward compatibility with results stored before multi-select.
  staffDecisionEquipmentTypes: z.array(equipmentTypeSchema).min(1).max(5).optional(),
  staffDecisionEquipmentType: equipmentTypeSchema.optional(),
  staffOverrideNote: z.string().trim().min(1).optional(),
});

// "AI แนะนำอุปกรณ์" stage: staff confirm (or override) the AI recommendation.
// Staff pick 1–5 equipment types. The AI result is optional — when the provider
// was unavailable the staff decision is still recorded and the workflow still
// advances (AI is decision support only).
export const confirmRecommendationSchema = z.object({
  aiRecommendationResult: aiRecommendationResultSchema.optional(),
  staffDecisionEquipmentTypes: z
    .array(equipmentTypeSchema)
    .min(1, "กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ")
    .max(5, "เลือกอุปกรณ์ได้สูงสุด 5 รายการ"),
  staffOverrideNote: optionalTextSchema,
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
    equipmentPhotos: z.array(mediaAssetSchema).min(1).max(3),
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
export type UrgencyLevel = z.infer<typeof urgencyLevelSchema>;
export type PrescribedEquipmentItem = z.infer<typeof prescribedEquipmentItemSchema>;
export type AssessmentForm = z.infer<typeof assessmentFormSchema>;
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
export type ConfirmRecommendationInput = z.infer<typeof confirmRecommendationSchema>;
export type LineContactChannel = z.infer<typeof lineContactChannelSchema>;
export type LineNotification = z.infer<typeof lineNotificationSchema>;
export type ReturnData = z.infer<typeof returnDataSchema>;
export type RejectionReason = z.infer<typeof rejectionReasonSchema>;
export type ApproveRequestInput = z.infer<typeof approveRequestSchema>;
export type RejectRequestInput = z.infer<typeof rejectRequestSchema>;
export type PrepareDeliveryInput = z.infer<typeof prepareDeliverySchema>;
export type StartReturnWaitingInput = z.infer<typeof startReturnWaitingSchema>;
export type BorrowingRequest = z.infer<typeof borrowingRequestSchema>;
export type PatientLocationSummary = z.infer<typeof patientLocationSummarySchema>;
