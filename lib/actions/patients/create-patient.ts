"use server"
import { db } from "@/lib/db"
import { ok, err } from "@/lib/actions/result"
import { fireAndForgetLineNotification } from "@/lib/integrations/line/fire-and-forget"

// Intake ("รับคำร้อง") captures the patient, address and photos only. The medical
// assessment, AI recommendation and equipment selection now happen later on the
// dedicated assessment ("ประเมินคำร้อง") page. The request is created at status
// "รับคำร้อง" (awaiting assessment) with no equipment type chosen yet.
interface CreatePatientInput {
  fullName: string
  nationalId: string
  dateOfBirth: string
  age: number
  gender: string
  phoneNumber: string
  reporterName?: string
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
}

export async function createPatient(input: CreatePatientInput) {
  try {
    const requestNumber = "REQ-" + Date.now()
    const result = await db.$transaction(async (tx) => {
      // A patient may borrow more than once over time, so nationalId (unique)
      // can already exist. Reuse the existing record and refresh the mutable
      // contact/address details to what intake just captured, rather than
      // failing on the unique constraint. Medical fields are only seeded on
      // first creation — they are filled in later during assessment.
      const contactData = {
        fullName: input.fullName,
        dateOfBirth: new Date(input.dateOfBirth),
        age: input.age,
        gender: input.gender,
        phoneNumber: input.phoneNumber,
        reporterName: input.reporterName?.trim() || null,
        houseNumber: input.address.houseNumber,
        moo: input.address.moo,
        province: input.address.province,
        district: input.address.district,
        subdistrict: input.address.subdistrict,
        postalCode: input.address.postalCode,
        latitude: input.location.latitude,
        longitude: input.location.longitude,
        googleMapsUrl: input.location.googleMapsUrl,
      }
      const patient = await tx.patient.upsert({
        where: { nationalId: input.nationalId },
        update: contactData,
        create: {
          nationalId: input.nationalId,
          ...contactData,
          // Medical fields are filled in during assessment; left empty at intake.
          chronicDiseases: [],
          walkingAbility: "",
          selfCareAbility: "",
          patientCondition: "",
          urgencyLevel: "",
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
          // Equipment type is chosen during assessment.
          requestedEquipmentType: "",
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
