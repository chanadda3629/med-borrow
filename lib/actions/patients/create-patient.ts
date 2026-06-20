"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"
import type { EquipmentType } from "@/lib/domain/schemas"

interface CreatePatientInput {
  fullName: string
  nationalId: string
  dateOfBirth: string
  age: number
  gender: string
  phoneNumber: string
  address: {
    houseNumber: string
    moo?: string
    province: string
    district: string
    subdistrict: string
    postalCode: string
  }
  location: {
    latitude: number
    longitude: number
    googleMapsUrl: string
  }
  patientPhotos: Array<{ url: string; publicId?: string }>
  homeEnvironmentPhotos: Array<{ url: string; publicId?: string }>
  medicalAssessment: {
    age: number
    chronicDiseases: string[]
    walkingAbility: string
    selfCareAbility: string
    patientCondition: string
    urgencyLevel: string
    checklistAnswers: string[]
  }
  staffDecisionEquipmentType: EquipmentType
}

export async function createPatient(input: CreatePatientInput) {
  try {
    const requestNumber = "REQ-" + Date.now()
    const result = await db.$transaction(async (tx) => {
      const patient = await tx.patient.create({
        data: {
          fullName: input.fullName,
          nationalId: input.nationalId,
          dateOfBirth: new Date(input.dateOfBirth),
          age: input.age,
          gender: input.gender,
          phoneNumber: input.phoneNumber,
          houseNumber: input.address.houseNumber,
          moo: input.address.moo,
          province: input.address.province,
          district: input.address.district,
          subdistrict: input.address.subdistrict,
          postalCode: input.address.postalCode,
          latitude: input.location.latitude,
          longitude: input.location.longitude,
          googleMapsUrl: input.location.googleMapsUrl,
          chronicDiseases: input.medicalAssessment.chronicDiseases,
          walkingAbility: input.medicalAssessment.walkingAbility,
          selfCareAbility: input.medicalAssessment.selfCareAbility,
          patientCondition: input.medicalAssessment.patientCondition,
          urgencyLevel: input.medicalAssessment.urgencyLevel,
        },
      })
      await tx.medicalAssessment.create({
        data: {
          patientId: patient.id,
          age: input.medicalAssessment.age,
          chronicDiseases: input.medicalAssessment.chronicDiseases,
          walkingAbility: input.medicalAssessment.walkingAbility,
          selfCareAbility: input.medicalAssessment.selfCareAbility,
          patientCondition: input.medicalAssessment.patientCondition,
          urgencyLevel: input.medicalAssessment.urgencyLevel,
          checklistAnswers: input.medicalAssessment.checklistAnswers,
        },
      })
      const allPhotos = [
        ...input.patientPhotos.map((p) => ({
          ...p,
          kind: "patient-photo" as const,
          patientId: patient.id,
        })),
        ...input.homeEnvironmentPhotos.map((p) => ({
          ...p,
          kind: "home-environment-photo" as const,
          patientId: patient.id,
        })),
      ]
      if (allPhotos.length > 0) {
        await tx.mediaAsset.createMany({ data: allPhotos })
      }
      const request = await tx.borrowingRequest.create({
        data: {
          requestNumber,
          patientId: patient.id,
          requestedEquipmentType: input.staffDecisionEquipmentType,
          workflowStatus: "รับคำร้อง",
        },
      })
      await tx.borrowingRequestStatusHistory.create({
        data: {
          requestId: request.id,
          fromStatus: "",
          toStatus: "รับคำร้อง",
        },
      })
      return request
    })
    fireAndForgetLineNotification(result.id, "request-submitted")
    return ok({ requestId: result.id })
  } catch (e) {
    return err(e instanceof Error ? e.message : "ไม่สามารถบันทึกข้อมูลได้")
  }
}
