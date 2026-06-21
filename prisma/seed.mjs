import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ─── Reference Data ───────────────────────────────────────────────────────────

const referenceGroups = [
  {
    category: "equipment_type",
    items: [
      ["bed", "เตียงผู้ป่วย"],
      ["wheelchair", "รถเข็น"],
      ["walker", "Walker"],
      ["cane", "ไม้เท้า"],
      ["suction_machine", "เครื่องดูดเสมหะ"],
      ["oxygen_tank", "ถังออกซิเจน"],
      ["air_mattress", "ที่นอนลม"],
      ["overbed_table", "โต๊ะคร่อมเตียง"],
      ["commode", "โถสุขภัณฑ์เคลื่อนที่"],
    ],
  },
  {
    category: "equipment_status",
    items: [
      ["available", "พร้อมใช้งาน"],
      ["borrowed", "ถูกยืม"],
      ["awaiting_return", "รอรับคืน"],
      ["damaged", "ชำรุด"],
      ["maintenance", "ซ่อมบำรุง"],
    ],
  },
  {
    category: "borrow_workflow_status",
    items: [
      ["received", "รับคำร้อง"],
      ["assessing_patient", "ประเมินผู้ป่วย"],
      ["ai_recommended", "AI แนะนำอุปกรณ์"],
      ["inventory_check", "ตรวจสอบคลังอุปกรณ์"],
      ["approved", "อนุมัติ"],
      ["rejected", "ไม่อนุมัติ"],
      ["preparing_delivery", "เตรียมจัดส่ง"],
      ["delivered", "จัดส่งสำเร็จ"],
      ["awaiting_return", "รอคืน"],
      ["returned", "คืนอุปกรณ์"],
      ["closed", "ปิดรายการ"],
    ],
  },
  {
    category: "checklist_option",
    items: [
      ["walk_independently", "เดินเองได้"],
      ["walk_with_walker", "เดินได้โดยใช้ Walker"],
      ["wheelchair", "ใช้รถเข็น"],
      ["bedridden", "ติดเตียง"],
      ["needs_oxygen", "ต้องการออกซิเจน"],
      ["pressure_sore", "มีแผลกดทับ"],
      ["cannot_self_care", "ช่วยเหลือตนเองไม่ได้"],
    ],
  },
  {
    category: "notification_trigger",
    items: [
      ["request-submitted", "Request submitted successfully"],
      ["approved", "Approved"],
      ["rejected", "Rejected"],
      ["preparing-delivery", "Preparing delivery"],
      ["delivery-completed", "Delivery completed"],
      ["return-due-soon", "Return due date is near"],
      ["returned", "Equipment returned"],
    ],
  },
  {
    category: "notification_delivery_status",
    items: [
      ["pending", "pending"],
      ["sent", "sent"],
      ["failed", "failed"],
    ],
  },
  {
    category: "return_condition",
    items: [
      ["usable", "ใช้งานได้"],
      ["damaged", "ชำรุด"],
    ],
  },
  {
    category: "contact_channel_type",
    items: [
      ["phone", "phone"],
      ["line-id", "line-id"],
    ],
  },
  {
    category: "approval_decision",
    items: [
      ["approved", "อนุมัติ"],
      ["rejected", "ไม่อนุมัติ"],
    ],
  },
  {
    category: "media_asset_kind",
    items: [
      ["patient-photo", "patient-photo"],
      ["home-environment-photo", "home-environment-photo"],
      ["assessment-supporting-photo", "assessment-supporting-photo"],
      ["return-condition-photo", "return-condition-photo"],
    ],
  },
  {
    category: "walking_ability",
    items: [
      ["walk_independently", "เดินเองได้"],
      ["walk_with_walker", "เดินได้โดยใช้ Walker"],
      ["wheelchair", "ใช้รถเข็น"],
      ["bedridden", "ติดเตียง"],
    ],
  },
  {
    category: "self_care_ability",
    items: [
      ["self_care", "ช่วยเหลือตนเองได้"],
      ["needs_assistance", "ช่วยเหลือตนเองไม่ได้"],
    ],
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────

const seedUsers = [
  { email: "admin@med-borrow.local", password: "Admin1234!", role: "ADMIN" },
  { email: "staff@med-borrow.local", password: "Staff1234!", role: "STAFF" },
  { email: "nurse@med-borrow.local", password: "Staff@12345", role: "STAFF" },
];

// ─── Equipment Items (22 serialized items across 9 types) ────────────────────
// currentLoanRequestId is set in a later pass to avoid circular FK

const equipmentItemData = [
  // เตียงผู้ป่วย (bed)
  { id: "equip-bed-001", equipmentId: "bed", equipmentCode: "BED-2023-001", assetNumber: "ครุภัณฑ์-0001", equipmentType: "bed", receivedDate: new Date("2023-01-15"), currentStatus: "available" },
  { id: "equip-bed-002", equipmentId: "bed", equipmentCode: "BED-2023-002", assetNumber: "ครุภัณฑ์-0002", equipmentType: "bed", receivedDate: new Date("2023-03-20"), currentStatus: "available" },
  { id: "equip-bed-003", equipmentId: "bed", equipmentCode: "BED-2024-001", assetNumber: "ครุภัณฑ์-0003", equipmentType: "bed", receivedDate: new Date("2024-02-10"), currentStatus: "borrowed" },
  // รถเข็น (wheelchair)
  { id: "equip-wc-001", equipmentId: "wheelchair", equipmentCode: "WC-2022-001", assetNumber: "ครุภัณฑ์-0004", equipmentType: "wheelchair", receivedDate: new Date("2022-06-01"), currentStatus: "available" },
  { id: "equip-wc-002", equipmentId: "wheelchair", equipmentCode: "WC-2022-002", assetNumber: "ครุภัณฑ์-0005", equipmentType: "wheelchair", receivedDate: new Date("2022-08-15"), currentStatus: "borrowed" },
  { id: "equip-wc-003", equipmentId: "wheelchair", equipmentCode: "WC-2023-001", assetNumber: "ครุภัณฑ์-0006", equipmentType: "wheelchair", receivedDate: new Date("2023-05-10"), currentStatus: "available" },
  { id: "equip-wc-004", equipmentId: "wheelchair", equipmentCode: "WC-2024-001", assetNumber: "ครุภัณฑ์-0007", equipmentType: "wheelchair", receivedDate: new Date("2024-01-20"), currentStatus: "available" },
  // Walker
  { id: "equip-wk-001", equipmentId: "walker", equipmentCode: "WK-2023-001", assetNumber: "ครุภัณฑ์-0008", equipmentType: "walker", receivedDate: new Date("2023-07-01"), currentStatus: "awaiting_return" },
  { id: "equip-wk-002", equipmentId: "walker", equipmentCode: "WK-2023-002", assetNumber: "ครุภัณฑ์-0009", equipmentType: "walker", receivedDate: new Date("2023-09-15"), currentStatus: "available" },
  { id: "equip-wk-003", equipmentId: "walker", equipmentCode: "WK-2024-001", assetNumber: "ครุภัณฑ์-0010", equipmentType: "walker", receivedDate: new Date("2024-03-05"), currentStatus: "available" },
  // ไม้เท้า (cane)
  { id: "equip-cn-001", equipmentId: "cane", equipmentCode: "CN-2022-001", assetNumber: "ครุภัณฑ์-0011", equipmentType: "cane", receivedDate: new Date("2022-11-01"), currentStatus: "available" },
  { id: "equip-cn-002", equipmentId: "cane", equipmentCode: "CN-2023-001", assetNumber: "ครุภัณฑ์-0012", equipmentType: "cane", receivedDate: new Date("2023-04-20"), currentStatus: "available" },
  { id: "equip-cn-003", equipmentId: "cane", equipmentCode: "CN-2024-001", assetNumber: "ครุภัณฑ์-0013", equipmentType: "cane", receivedDate: new Date("2024-01-10"), currentStatus: "available" },
  // เครื่องดูดเสมหะ (suction_machine)
  { id: "equip-sm-001", equipmentId: "suction_machine", equipmentCode: "SM-2023-001", assetNumber: "ครุภัณฑ์-0014", equipmentType: "suction_machine", receivedDate: new Date("2023-02-28"), currentStatus: "available" },
  { id: "equip-sm-002", equipmentId: "suction_machine", equipmentCode: "SM-2024-001", assetNumber: "ครุภัณฑ์-0015", equipmentType: "suction_machine", receivedDate: new Date("2024-04-15"), currentStatus: "damaged" },
  // ถังออกซิเจน (oxygen_tank)
  { id: "equip-ox-001", equipmentId: "oxygen_tank", equipmentCode: "OX-2022-001", assetNumber: "ครุภัณฑ์-0016", equipmentType: "oxygen_tank", receivedDate: new Date("2022-09-10"), currentStatus: "borrowed" },
  { id: "equip-ox-002", equipmentId: "oxygen_tank", equipmentCode: "OX-2023-001", assetNumber: "ครุภัณฑ์-0017", equipmentType: "oxygen_tank", receivedDate: new Date("2023-11-05"), currentStatus: "available" },
  // ที่นอนลม (air_mattress)
  { id: "equip-am-001", equipmentId: "air_mattress", equipmentCode: "AM-2023-001", assetNumber: "ครุภัณฑ์-0018", equipmentType: "air_mattress", receivedDate: new Date("2023-06-30"), currentStatus: "available" },
  { id: "equip-am-002", equipmentId: "air_mattress", equipmentCode: "AM-2024-001", assetNumber: "ครุภัณฑ์-0019", equipmentType: "air_mattress", receivedDate: new Date("2024-05-01"), currentStatus: "available" },
  // โต๊ะคร่อมเตียง (overbed_table)
  { id: "equip-ot-001", equipmentId: "overbed_table", equipmentCode: "OT-2023-001", assetNumber: "ครุภัณฑ์-0020", equipmentType: "overbed_table", receivedDate: new Date("2023-08-20"), currentStatus: "maintenance" },
  // โถสุขภัณฑ์เคลื่อนที่ (commode)
  { id: "equip-cd-001", equipmentId: "commode", equipmentCode: "CD-2023-001", assetNumber: "ครุภัณฑ์-0021", equipmentType: "commode", receivedDate: new Date("2023-10-15"), currentStatus: "available" },
  { id: "equip-cd-002", equipmentId: "commode", equipmentCode: "CD-2024-001", assetNumber: "ครุภัณฑ์-0022", equipmentType: "commode", receivedDate: new Date("2024-06-01"), currentStatus: "available" },
];

// ─── Patients (8 realistic Thai patients) ─────────────────────────────────────

const patientData = [
  {
    id: "patient-001",
    fullName: "นาง สุดา มานะกิจ",
    nationalId: "3600100234562",
    dateOfBirth: new Date("1958-03-15"),
    age: 68,
    gender: "หญิง",
    phoneNumber: "0812345678",
    houseNumber: "12/4",
    moo: "3",
    province: "เชียงใหม่",
    district: "เมืองเชียงใหม่",
    subdistrict: "ช้างเผือก",
    postalCode: "50300",
    latitude: 18.7883,
    longitude: 98.9853,
    googleMapsUrl: "https://maps.google.com/?q=18.7883,98.9853",
    chronicDiseases: ["เบาหวาน", "ความดันโลหิตสูง"],
    walkingAbility: "wheelchair",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยไม่สามารถเดินได้ ต้องใช้รถเข็นในการเคลื่อนที่ มีโรคประจำตัวเบาหวานและความดัน",
    urgencyLevel: "สูง",
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "patient-002",
    fullName: "นาย ประเสริฐ ทองคำ",
    nationalId: "1100200345671",
    dateOfBirth: new Date("1950-07-22"),
    age: 75,
    gender: "ชาย",
    phoneNumber: "0823456789",
    houseNumber: "45",
    moo: null,
    province: "กรุงเทพมหานคร",
    district: "บางรัก",
    subdistrict: "บางรัก",
    postalCode: "10500",
    latitude: 13.7231,
    longitude: 100.5179,
    googleMapsUrl: "https://maps.google.com/?q=13.7231,100.5179",
    chronicDiseases: ["โรคหลอดเลือดสมอง", "ความดันโลหิตสูง"],
    walkingAbility: "walk_with_walker",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยโรคหลอดเลือดสมอง ขาซ้ายอ่อนแรง เดินได้โดยใช้ Walker ช่วย",
    urgencyLevel: "ปานกลาง",
    createdAt: new Date("2026-05-01"),
  },
  {
    id: "patient-003",
    fullName: "นาง มาลี วงษ์สุวรรณ",
    nationalId: "1471100456783",
    dateOfBirth: new Date("1962-11-08"),
    age: 63,
    gender: "หญิง",
    phoneNumber: "0834567890",
    houseNumber: "88/2",
    moo: "5",
    province: "เชียงใหม่",
    district: "สันทราย",
    subdistrict: "สันทรายน้อย",
    postalCode: "50210",
    latitude: 18.8555,
    longitude: 99.0246,
    googleMapsUrl: "https://maps.google.com/?q=18.8555,99.0246",
    chronicDiseases: ["มะเร็งปอด"],
    walkingAbility: "bedridden",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยมะเร็งปอดระยะสุดท้าย ติดเตียง ต้องได้รับการดูแลตลอด 24 ชั่วโมง",
    urgencyLevel: "สูงมาก",
    createdAt: new Date("2026-06-01"),
  },
  {
    id: "patient-004",
    fullName: "นาย สมชาย ศรีสว่าง",
    nationalId: "3400100567894",
    dateOfBirth: new Date("1945-05-30"),
    age: 81,
    gender: "ชาย",
    phoneNumber: "0845678901",
    houseNumber: "7",
    moo: "2",
    province: "ขอนแก่น",
    district: "เมืองขอนแก่น",
    subdistrict: "ในเมือง",
    postalCode: "40000",
    latitude: 16.4419,
    longitude: 102.836,
    googleMapsUrl: "https://maps.google.com/?q=16.4419,102.8360",
    chronicDiseases: ["ถุงลมโป่งพอง", "โรคหัวใจ"],
    walkingAbility: "wheelchair",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยถุงลมโป่งพอง หายใจลำบาก ต้องใช้ออกซิเจนเสริม ใช้รถเข็นในการเคลื่อนที่",
    urgencyLevel: "สูง",
    createdAt: new Date("2026-06-10"),
  },
  {
    id: "patient-005",
    fullName: "นาง จิราพร สุขสมบัติ",
    nationalId: "3300100678905",
    dateOfBirth: new Date("1955-02-14"),
    age: 71,
    gender: "หญิง",
    phoneNumber: "0856789012",
    houseNumber: "156/1",
    moo: null,
    province: "นครราชสีมา",
    district: "เมืองนครราชสีมา",
    subdistrict: "ในเมือง",
    postalCode: "30000",
    latitude: 14.9799,
    longitude: 102.0978,
    googleMapsUrl: "https://maps.google.com/?q=14.9799,102.0978",
    chronicDiseases: ["มะเร็งลำไส้", "เบาหวาน"],
    walkingAbility: "bedridden",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยมะเร็งลำไส้ระยะ 4 ติดเตียง มีแผลกดทับ ต้องการที่นอนลมเพื่อป้องกันแผลกดทับ",
    urgencyLevel: "สูงมาก",
    createdAt: new Date("2026-06-12"),
  },
  {
    id: "patient-006",
    fullName: "นาย วิชาย ใจดี",
    nationalId: "2600100789016",
    dateOfBirth: new Date("1968-09-03"),
    age: 57,
    gender: "ชาย",
    phoneNumber: "0867890123",
    houseNumber: "23/5",
    moo: "1",
    province: "นนทบุรี",
    district: "เมืองนนทบุรี",
    subdistrict: "สวนใหญ่",
    postalCode: "11000",
    latitude: 13.8609,
    longitude: 100.5193,
    googleMapsUrl: "https://maps.google.com/?q=13.8609,100.5193",
    chronicDiseases: ["ข้อเข่าเสื่อม"],
    walkingAbility: "walk_with_walker",
    selfCareAbility: "self_care",
    patientCondition: "ผู้ป่วยหลังผ่าตัดเข่าซ้าย ต้องใช้ Walker ช่วยในการเดินระหว่างฟื้นฟู",
    urgencyLevel: "ปานกลาง",
    createdAt: new Date("2026-06-15"),
  },
  {
    id: "patient-007",
    fullName: "นาง อรุณี พิมพ์สวาท",
    nationalId: "3100200890127",
    dateOfBirth: new Date("1952-12-25"),
    age: 73,
    gender: "หญิง",
    phoneNumber: "0878901234",
    houseNumber: "9/3",
    moo: "4",
    province: "สมุทรปราการ",
    district: "เมืองสมุทรปราการ",
    subdistrict: "ปากน้ำ",
    postalCode: "10270",
    latitude: 13.599,
    longitude: 100.5998,
    googleMapsUrl: "https://maps.google.com/?q=13.5990,100.5998",
    chronicDiseases: ["โรคหัวใจ", "ความดันโลหิตสูง", "เบาหวาน"],
    walkingAbility: "bedridden",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยโรคหัวใจล้มเหลว ติดเตียง ต้องการที่นอนลมเพื่อป้องกันแผลกดทับ",
    urgencyLevel: "สูง",
    createdAt: new Date("2026-06-18"),
  },
  {
    id: "patient-008",
    fullName: "นาย ธีรพงษ์ รักษาการ",
    nationalId: "1640100901238",
    dateOfBirth: new Date("1960-04-17"),
    age: 66,
    gender: "ชาย",
    phoneNumber: "0889012345",
    houseNumber: "34",
    moo: "2",
    province: "ชลบุรี",
    district: "เมืองชลบุรี",
    subdistrict: "บางปลาสร้อย",
    postalCode: "20000",
    latitude: 13.3611,
    longitude: 100.9847,
    googleMapsUrl: "https://maps.google.com/?q=13.3611,100.9847",
    chronicDiseases: ["โรคพาร์กินสัน"],
    walkingAbility: "walk_independently",
    selfCareAbility: "self_care",
    patientCondition: "ผู้ป่วยโรคพาร์กินสันระยะเริ่มต้น ทรงตัวไม่ดี ต้องการไม้เท้าช่วยในการเดิน",
    urgencyLevel: "ต่ำ",
    createdAt: new Date("2026-06-21"),
  },
];

// ─── Medical Assessments ──────────────────────────────────────────────────────

const medicalAssessmentData = [
  {
    id: "assess-001",
    patientId: "patient-001",
    age: 68,
    chronicDiseases: ["เบาหวาน", "ความดันโลหิตสูง"],
    walkingAbility: "wheelchair",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยไม่สามารถเดินได้ ต้องใช้รถเข็นในการเคลื่อนที่ มีโรคประจำตัวเบาหวานและความดัน",
    urgencyLevel: "สูง",
    checklistAnswers: ["wheelchair", "cannot_self_care"],
    createdAt: new Date("2026-04-01"),
  },
  {
    id: "assess-002",
    patientId: "patient-002",
    age: 75,
    chronicDiseases: ["โรคหลอดเลือดสมอง", "ความดันโลหิตสูง"],
    walkingAbility: "walk_with_walker",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยโรคหลอดเลือดสมอง ขาซ้ายอ่อนแรง เดินได้โดยใช้ Walker ช่วย",
    urgencyLevel: "ปานกลาง",
    checklistAnswers: ["walk_with_walker", "cannot_self_care"],
    createdAt: new Date("2026-05-01"),
  },
  {
    id: "assess-003",
    patientId: "patient-003",
    age: 63,
    chronicDiseases: ["มะเร็งปอด"],
    walkingAbility: "bedridden",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยมะเร็งปอดระยะสุดท้าย ติดเตียง ต้องได้รับการดูแลตลอด 24 ชั่วโมง",
    urgencyLevel: "สูงมาก",
    checklistAnswers: ["bedridden", "cannot_self_care", "needs_oxygen"],
    createdAt: new Date("2026-06-01"),
  },
  {
    id: "assess-004",
    patientId: "patient-004",
    age: 81,
    chronicDiseases: ["ถุงลมโป่งพอง", "โรคหัวใจ"],
    walkingAbility: "wheelchair",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยถุงลมโป่งพอง หายใจลำบาก ต้องใช้ออกซิเจนเสริม ใช้รถเข็นในการเคลื่อนที่",
    urgencyLevel: "สูง",
    checklistAnswers: ["wheelchair", "needs_oxygen", "cannot_self_care"],
    createdAt: new Date("2026-06-10"),
  },
  {
    id: "assess-005",
    patientId: "patient-005",
    age: 71,
    chronicDiseases: ["มะเร็งลำไส้", "เบาหวาน"],
    walkingAbility: "bedridden",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยมะเร็งลำไส้ระยะ 4 ติดเตียง มีแผลกดทับ ต้องการที่นอนลมเพื่อป้องกันแผลกดทับ",
    urgencyLevel: "สูงมาก",
    checklistAnswers: ["bedridden", "pressure_sore", "cannot_self_care"],
    createdAt: new Date("2026-06-12"),
  },
  {
    id: "assess-006",
    patientId: "patient-006",
    age: 57,
    chronicDiseases: ["ข้อเข่าเสื่อม"],
    walkingAbility: "walk_with_walker",
    selfCareAbility: "self_care",
    patientCondition: "ผู้ป่วยหลังผ่าตัดเข่าซ้าย ต้องใช้ Walker ช่วยในการเดินระหว่างฟื้นฟู",
    urgencyLevel: "ปานกลาง",
    checklistAnswers: ["walk_with_walker"],
    createdAt: new Date("2026-06-15"),
  },
  {
    id: "assess-007",
    patientId: "patient-007",
    age: 73,
    chronicDiseases: ["โรคหัวใจ", "ความดันโลหิตสูง", "เบาหวาน"],
    walkingAbility: "bedridden",
    selfCareAbility: "needs_assistance",
    patientCondition: "ผู้ป่วยโรคหัวใจล้มเหลว ติดเตียง ต้องการที่นอนลมเพื่อป้องกันแผลกดทับ",
    urgencyLevel: "สูง",
    checklistAnswers: ["bedridden", "cannot_self_care"],
    createdAt: new Date("2026-06-18"),
  },
  {
    id: "assess-008",
    patientId: "patient-008",
    age: 66,
    chronicDiseases: ["โรคพาร์กินสัน"],
    walkingAbility: "walk_independently",
    selfCareAbility: "self_care",
    patientCondition: "ผู้ป่วยโรคพาร์กินสันระยะเริ่มต้น ทรงตัวไม่ดี ต้องการไม้เท้าช่วยในการเดิน",
    urgencyLevel: "ต่ำ",
    checklistAnswers: ["walk_independently"],
    createdAt: new Date("2026-06-21"),
  },
];

// ─── Borrowing Requests ───────────────────────────────────────────────────────
// 8 requests spanning all workflow stages

const borrowingRequestData = [
  // BR-001: CLOSED — patient-001, wheelchair (WC-2022-001 returned)
  {
    id: "req-001",
    requestNumber: "BR-2026-0001",
    patientId: "patient-001",
    requestedEquipmentType: "wheelchair",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "wheelchair", score: 95, reason: "ผู้ป่วยไม่สามารถเดินได้ รถเข็นเป็นอุปกรณ์ที่เหมาะสมที่สุด", rank: 1 },
        { equipmentType: "bed", score: 60, reason: "อาจต้องการเตียงผู้ป่วยเสริมในอนาคต", rank: 2 },
      ],
      summary: "แนะนำรถเข็นเป็นอุปกรณ์หลักสำหรับผู้ป่วยรายนี้",
    },
    assignedEquipmentItemId: "equip-wc-001",
    workflowStatus: "closed",
    approvalDecision: "approved",
    deliveryStatus: null,
    dueOrReturnDate: new Date("2026-05-15"),
    createdAt: new Date("2026-04-01"),
  },
  // BR-002: AWAITING_RETURN — patient-002, walker (WK-2023-001 on loan)
  {
    id: "req-002",
    requestNumber: "BR-2026-0002",
    patientId: "patient-002",
    requestedEquipmentType: "walker",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "walker", score: 88, reason: "ผู้ป่วยโรคหลอดเลือดสมองที่ขาอ่อนแรง Walker ช่วยพยุงได้ดี", rank: 1 },
        { equipmentType: "cane", score: 45, reason: "ไม้เท้าอาจไม่เพียงพอสำหรับระดับอาการปัจจุบัน", rank: 2 },
      ],
      summary: "แนะนำ Walker เพื่อช่วยพยุงการเดิน",
    },
    assignedEquipmentItemId: "equip-wk-001",
    workflowStatus: "awaiting_return",
    approvalDecision: "approved",
    deliveryStatus: null,
    dueOrReturnDate: new Date("2026-07-10"),
    createdAt: new Date("2026-05-01"),
  },
  // BR-003: DELIVERED — patient-003, bed (BED-2024-001 on loan)
  {
    id: "req-003",
    requestNumber: "BR-2026-0003",
    patientId: "patient-003",
    requestedEquipmentType: "bed",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "bed", score: 98, reason: "ผู้ป่วยติดเตียงต้องการเตียงผู้ป่วยปรับระดับได้", rank: 1 },
        { equipmentType: "air_mattress", score: 85, reason: "ควรใช้ร่วมกับที่นอนลมเพื่อป้องกันแผลกดทับ", rank: 2 },
      ],
      summary: "แนะนำเตียงผู้ป่วยเป็นความต้องการเร่งด่วน",
    },
    assignedEquipmentItemId: "equip-bed-003",
    workflowStatus: "delivered",
    approvalDecision: "approved",
    deliveryStatus: null,
    dueOrReturnDate: new Date("2026-08-15"),
    createdAt: new Date("2026-06-01"),
  },
  // BR-004: PREPARING_DELIVERY — patient-004, wheelchair (WC-2022-002 assigned)
  {
    id: "req-004",
    requestNumber: "BR-2026-0004",
    patientId: "patient-004",
    requestedEquipmentType: "wheelchair",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "wheelchair", score: 92, reason: "ผู้ป่วยถุงลมโป่งพองต้องการรถเข็นเพื่อลดการใช้พลังงาน", rank: 1 },
        { equipmentType: "oxygen_tank", score: 90, reason: "ถังออกซิเจนสำคัญมากสำหรับผู้ป่วยที่มีปัญหาการหายใจ", rank: 2 },
      ],
      summary: "แนะนำรถเข็นและอาจต้องพิจารณาถังออกซิเจนเพิ่มเติม",
    },
    assignedEquipmentItemId: "equip-wc-002",
    workflowStatus: "preparing_delivery",
    approvalDecision: "approved",
    deliveryStatus: null,
    dueOrReturnDate: new Date("2026-09-01"),
    createdAt: new Date("2026-06-10"),
  },
  // BR-005: APPROVED — patient-005, air_mattress (OX-2022-001 assigned — note: different type requested vs assigned for demo variety)
  {
    id: "req-005",
    requestNumber: "BR-2026-0005",
    patientId: "patient-005",
    requestedEquipmentType: "air_mattress",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "air_mattress", score: 97, reason: "ผู้ป่วยมีแผลกดทับ ที่นอนลมจำเป็นมากเพื่อลดแรงกด", rank: 1 },
        { equipmentType: "bed", score: 75, reason: "เตียงผู้ป่วยช่วยให้ดูแลได้ง่ายขึ้น", rank: 2 },
      ],
      summary: "ที่นอนลมเป็นความต้องการเร่งด่วนเพื่อป้องกันแผลกดทับ",
    },
    assignedEquipmentItemId: "equip-ox-001",
    workflowStatus: "approved",
    approvalDecision: "approved",
    deliveryStatus: null,
    dueOrReturnDate: new Date("2026-09-15"),
    createdAt: new Date("2026-06-12"),
  },
  // BR-006: INVENTORY_CHECK — patient-006, walker (no equipment assigned yet)
  {
    id: "req-006",
    requestNumber: "BR-2026-0006",
    patientId: "patient-006",
    requestedEquipmentType: "walker",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "walker", score: 85, reason: "ผู้ป่วยหลังผ่าตัดเข่าต้องการ Walker ในการฟื้นฟู", rank: 1 },
        { equipmentType: "cane", score: 50, reason: "ไม้เท้าอาจพิจารณาใช้ได้เมื่ออาการดีขึ้น", rank: 2 },
      ],
      summary: "แนะนำ Walker สำหรับการฟื้นฟูหลังผ่าตัด",
    },
    assignedEquipmentItemId: null,
    workflowStatus: "inventory_check",
    approvalDecision: null,
    deliveryStatus: null,
    dueOrReturnDate: null,
    createdAt: new Date("2026-06-15"),
  },
  // BR-007: AI_RECOMMENDED — patient-007, air_mattress (no equipment assigned yet)
  {
    id: "req-007",
    requestNumber: "BR-2026-0007",
    patientId: "patient-007",
    requestedEquipmentType: "air_mattress",
    aiRecommendationResult: {
      recommendations: [
        { equipmentType: "air_mattress", score: 96, reason: "ผู้ป่วยติดเตียงโรคหัวใจ ที่นอนลมจำเป็นเพื่อป้องกันแผลกดทับ", rank: 1 },
        { equipmentType: "overbed_table", score: 60, reason: "โต๊ะคร่อมเตียงอำนวยความสะดวกในการรับประทานอาหาร", rank: 2 },
      ],
      summary: "แนะนำที่นอนลมเป็นลำดับแรก",
    },
    assignedEquipmentItemId: null,
    workflowStatus: "ai_recommended",
    approvalDecision: null,
    deliveryStatus: null,
    dueOrReturnDate: null,
    createdAt: new Date("2026-06-18"),
  },
  // BR-008: RECEIVED — patient-008, cane (just submitted, no equipment)
  {
    id: "req-008",
    requestNumber: "BR-2026-0008",
    patientId: "patient-008",
    requestedEquipmentType: "cane",
    aiRecommendationResult: null,
    assignedEquipmentItemId: null,
    workflowStatus: "received",
    approvalDecision: null,
    deliveryStatus: null,
    dueOrReturnDate: null,
    createdAt: new Date("2026-06-21"),
  },
];

// ─── Borrowing Request Status Histories ───────────────────────────────────────

function makeHistory(requestId, transitions, baseDate) {
  return transitions.map(([from, to, daysOffset]) => ({
    requestId,
    fromStatus: from,
    toStatus: to,
    changedAt: new Date(baseDate.getTime() + daysOffset * 24 * 60 * 60 * 1000),
    changedByUserId: null,
    note: null,
  }));
}

const req001Base = new Date("2026-04-01");
const req002Base = new Date("2026-05-01");
const req003Base = new Date("2026-06-01");
const req004Base = new Date("2026-06-10");
const req005Base = new Date("2026-06-12");
const req006Base = new Date("2026-06-15");
const req007Base = new Date("2026-06-18");
const req008Base = new Date("2026-06-21");

const statusHistories = [
  // BR-001: full lifecycle → closed
  ...makeHistory("req-001", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
    ["ai_recommended", "inventory_check", 3],
    ["inventory_check", "approved", 4],
    ["approved", "preparing_delivery", 5],
    ["preparing_delivery", "delivered", 7],
    ["delivered", "awaiting_return", 7],
    ["awaiting_return", "returned", 44],
    ["returned", "closed", 44],
  ], req001Base),
  // BR-002: → awaiting_return
  ...makeHistory("req-002", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
    ["ai_recommended", "inventory_check", 3],
    ["inventory_check", "approved", 4],
    ["approved", "preparing_delivery", 5],
    ["preparing_delivery", "delivered", 7],
    ["delivered", "awaiting_return", 7],
  ], req002Base),
  // BR-003: → delivered
  ...makeHistory("req-003", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
    ["ai_recommended", "inventory_check", 3],
    ["inventory_check", "approved", 4],
    ["approved", "preparing_delivery", 5],
    ["preparing_delivery", "delivered", 7],
  ], req003Base),
  // BR-004: → preparing_delivery
  ...makeHistory("req-004", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
    ["ai_recommended", "inventory_check", 3],
    ["inventory_check", "approved", 5],
    ["approved", "preparing_delivery", 8],
  ], req004Base),
  // BR-005: → approved
  ...makeHistory("req-005", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
    ["ai_recommended", "inventory_check", 3],
    ["inventory_check", "approved", 8],
  ], req005Base),
  // BR-006: → inventory_check
  ...makeHistory("req-006", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
    ["ai_recommended", "inventory_check", 4],
  ], req006Base),
  // BR-007: → ai_recommended
  ...makeHistory("req-007", [
    ["received", "assessing_patient", 1],
    ["assessing_patient", "ai_recommended", 2],
  ], req007Base),
  // BR-008: → received (no transition yet)
];

// ─── Equipment Item Status Histories ─────────────────────────────────────────

const equipmentStatusHistories = [
  // WC-2022-001: available → borrowed (req-001) → available (returned)
  { equipmentItemId: "equip-wc-001", fromStatus: "available", toStatus: "borrowed", changedAt: new Date("2026-04-05"), note: "อนุมัติคำร้อง BR-2026-0001" },
  { equipmentItemId: "equip-wc-001", fromStatus: "borrowed", toStatus: "available", changedAt: new Date("2026-05-15"), note: "รับคืนจาก BR-2026-0001 สภาพดี" },
  // WK-2023-001: available → borrowed (req-002) → awaiting_return
  { equipmentItemId: "equip-wk-001", fromStatus: "available", toStatus: "borrowed", changedAt: new Date("2026-05-05"), note: "อนุมัติคำร้อง BR-2026-0002" },
  { equipmentItemId: "equip-wk-001", fromStatus: "borrowed", toStatus: "awaiting_return", changedAt: new Date("2026-05-08"), note: "จัดส่งแล้ว รอรับคืนภายใน 10 กรกฎาคม 2569" },
  // BED-2024-001: available → borrowed (req-003)
  { equipmentItemId: "equip-bed-003", fromStatus: "available", toStatus: "borrowed", changedAt: new Date("2026-06-05"), note: "อนุมัติคำร้อง BR-2026-0003" },
  // WC-2022-002: available → borrowed (req-004)
  { equipmentItemId: "equip-wc-002", fromStatus: "available", toStatus: "borrowed", changedAt: new Date("2026-06-15"), note: "อนุมัติคำร้อง BR-2026-0004" },
  // OX-2022-001: available → borrowed (req-005)
  { equipmentItemId: "equip-ox-001", fromStatus: "available", toStatus: "borrowed", changedAt: new Date("2026-06-20"), note: "อนุมัติคำร้อง BR-2026-0005" },
  // SM-2024-001: available → damaged
  { equipmentItemId: "equip-sm-002", fromStatus: "available", toStatus: "damaged", changedAt: new Date("2024-05-10"), note: "ตรวจพบว่าชำรุดระหว่างการตรวจสอบประจำปี" },
  // OT-2023-001: available → maintenance
  { equipmentItemId: "equip-ot-001", fromStatus: "available", toStatus: "maintenance", changedAt: new Date("2025-11-20"), note: "ส่งซ่อมบำรุงตามกำหนด" },
];

// ─── Borrowing Return (BR-001 completed return) ───────────────────────────────

const borrowingReturnData = [
  {
    requestId: "req-001",
    equipmentItemId: "equip-wc-001",
    returnDate: new Date("2026-05-15"),
    receivingStaffName: "พยาบาล สุภาพร ชัยรัตน์",
    condition: "usable",
    damageNote: null,
    equipmentPhotoUrl: "https://res.cloudinary.com/demo/image/upload/v1/med-borrow/returns/wc-001-return-20260515.jpg",
    equipmentPhotoPublicId: "med-borrow/returns/wc-001-return-20260515",
    createdAt: new Date("2026-05-15"),
  },
];

// ─── Equipment Item Return Histories ─────────────────────────────────────────

const equipmentReturnHistoryData = [
  {
    equipmentItemId: "equip-wc-001",
    requestId: "req-001",
    condition: "usable",
    returnDate: new Date("2026-05-15"),
    receivingStaffName: "พยาบาล สุภาพร ชัยรัตน์",
    damageNote: null,
    equipmentPhotoUrl: "https://res.cloudinary.com/demo/image/upload/v1/med-borrow/returns/wc-001-return-20260515.jpg",
    equipmentPhotoPublicId: "med-borrow/returns/wc-001-return-20260515",
  },
];

// ─── Notification Histories ───────────────────────────────────────────────────

const notificationData = [
  // BR-001 notifications (full lifecycle)
  { patientId: "patient-001", requestId: "req-001", channelType: "line-id", channelValue: "sudamanakij58", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืมอุปกรณ์ของท่าน (BR-2026-0001) ได้รับการบันทึกเรียบร้อยแล้ว", triggeredAt: new Date("2026-04-01"), deliveredAt: new Date("2026-04-01") },
  { patientId: "patient-001", requestId: "req-001", channelType: "line-id", channelValue: "sudamanakij58", trigger: "approved", deliveryStatus: "sent", message: "คำร้องขอยืมอุปกรณ์ (BR-2026-0001) ได้รับการอนุมัติแล้ว รถเข็น WC-2022-001 จะถูกจัดส่งให้ท่าน", triggeredAt: new Date("2026-04-05"), deliveredAt: new Date("2026-04-05") },
  { patientId: "patient-001", requestId: "req-001", channelType: "line-id", channelValue: "sudamanakij58", trigger: "preparing-delivery", deliveryStatus: "sent", message: "กำลังเตรียมจัดส่งรถเข็น WC-2022-001 ให้ท่าน", triggeredAt: new Date("2026-04-06"), deliveredAt: new Date("2026-04-06") },
  { patientId: "patient-001", requestId: "req-001", channelType: "line-id", channelValue: "sudamanakij58", trigger: "delivery-completed", deliveryStatus: "sent", message: "จัดส่งรถเข็นให้ท่านเรียบร้อยแล้ว กรุณาคืนภายในวันที่ 15 พฤษภาคม 2569", triggeredAt: new Date("2026-04-08"), deliveredAt: new Date("2026-04-08") },
  { patientId: "patient-001", requestId: "req-001", channelType: "line-id", channelValue: "sudamanakij58", trigger: "returned", deliveryStatus: "sent", message: "ได้รับคืนอุปกรณ์รถเข็น WC-2022-001 เรียบร้อยแล้ว ขอบคุณที่ใช้บริการ", triggeredAt: new Date("2026-05-15"), deliveredAt: new Date("2026-05-15") },
  // BR-002 notifications
  { patientId: "patient-002", requestId: "req-002", channelType: "phone", channelValue: "0823456789", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืมอุปกรณ์ของท่าน (BR-2026-0002) ได้รับการบันทึกเรียบร้อยแล้ว", triggeredAt: new Date("2026-05-01"), deliveredAt: new Date("2026-05-01") },
  { patientId: "patient-002", requestId: "req-002", channelType: "phone", channelValue: "0823456789", trigger: "approved", deliveryStatus: "sent", message: "คำร้องขอยืม Walker (BR-2026-0002) ได้รับการอนุมัติ", triggeredAt: new Date("2026-05-05"), deliveredAt: new Date("2026-05-05") },
  { patientId: "patient-002", requestId: "req-002", channelType: "phone", channelValue: "0823456789", trigger: "delivery-completed", deliveryStatus: "sent", message: "จัดส่ง Walker ให้ท่านเรียบร้อยแล้ว กำหนดคืน 10 กรกฎาคม 2569", triggeredAt: new Date("2026-05-08"), deliveredAt: new Date("2026-05-08") },
  { patientId: "patient-002", requestId: "req-002", channelType: "phone", channelValue: "0823456789", trigger: "return-due-soon", deliveryStatus: "sent", message: "แจ้งเตือน: กำหนดคืน Walker ของท่านคือวันที่ 10 กรกฎาคม 2569 (อีก 7 วัน)", triggeredAt: new Date("2026-07-03"), deliveredAt: new Date("2026-07-03") },
  // BR-003 notifications
  { patientId: "patient-003", requestId: "req-003", channelType: "line-id", channelValue: "malee_w2526", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืมเตียงผู้ป่วย (BR-2026-0003) ได้รับการบันทึกแล้ว", triggeredAt: new Date("2026-06-01"), deliveredAt: new Date("2026-06-01") },
  { patientId: "patient-003", requestId: "req-003", channelType: "line-id", channelValue: "malee_w2526", trigger: "approved", deliveryStatus: "sent", message: "คำร้องของท่านได้รับการอนุมัติ กำลังเตรียมจัดส่งเตียงผู้ป่วย", triggeredAt: new Date("2026-06-05"), deliveredAt: new Date("2026-06-05") },
  { patientId: "patient-003", requestId: "req-003", channelType: "line-id", channelValue: "malee_w2526", trigger: "delivery-completed", deliveryStatus: "sent", message: "จัดส่งเตียงผู้ป่วยให้ท่านเรียบร้อยแล้ว", triggeredAt: new Date("2026-06-08"), deliveredAt: new Date("2026-06-08") },
  // BR-004 notifications
  { patientId: "patient-004", requestId: "req-004", channelType: "line-id", channelValue: "somchai_sri45", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืมรถเข็น (BR-2026-0004) ได้รับการบันทึกแล้ว", triggeredAt: new Date("2026-06-10"), deliveredAt: new Date("2026-06-10") },
  { patientId: "patient-004", requestId: "req-004", channelType: "line-id", channelValue: "somchai_sri45", trigger: "approved", deliveryStatus: "sent", message: "คำร้องของท่านได้รับการอนุมัติ กำลังเตรียมจัดส่ง", triggeredAt: new Date("2026-06-15"), deliveredAt: new Date("2026-06-15") },
  // BR-005 notifications
  { patientId: "patient-005", requestId: "req-005", channelType: "phone", channelValue: "0856789012", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืมที่นอนลม (BR-2026-0005) ได้รับการบันทึกแล้ว", triggeredAt: new Date("2026-06-12"), deliveredAt: new Date("2026-06-12") },
  { patientId: "patient-005", requestId: "req-005", channelType: "phone", channelValue: "0856789012", trigger: "approved", deliveryStatus: "sent", message: "คำร้องของท่านได้รับการอนุมัติ รออนุมัติจัดส่ง", triggeredAt: new Date("2026-06-20"), deliveredAt: new Date("2026-06-20") },
  // BR-006 notifications
  { patientId: "patient-006", requestId: "req-006", channelType: "line-id", channelValue: "wichai_jd1968", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืม Walker (BR-2026-0006) ได้รับการบันทึกแล้ว", triggeredAt: new Date("2026-06-15"), deliveredAt: new Date("2026-06-15") },
  // BR-007 notifications
  { patientId: "patient-007", requestId: "req-007", channelType: "phone", channelValue: "0878901234", trigger: "request-submitted", deliveryStatus: "sent", message: "คำร้องขอยืมที่นอนลม (BR-2026-0007) ได้รับการบันทึกแล้ว", triggeredAt: new Date("2026-06-18"), deliveredAt: new Date("2026-06-18") },
  // BR-008 — LINE failed (wrong ID)
  { patientId: "patient-008", requestId: "req-008", channelType: "line-id", channelValue: "theerapat_r1960", trigger: "request-submitted", deliveryStatus: "failed", message: "คำร้องขอยืมไม้เท้า (BR-2026-0008) ได้รับการบันทึกแล้ว", triggeredAt: new Date("2026-06-21"), deliveredAt: null, errorMessage: "LINE user not found — invalid LINE ID" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding reference values...");
  for (const group of referenceGroups) {
    for (const [sortOrder, [code, label]] of group.items.entries()) {
      await prisma.referenceValue.upsert({
        where: { category_code: { category: group.category, code } },
        update: { label, sortOrder, isActive: true },
        create: { category: group.category, code, label, sortOrder },
      });
    }
  }

  console.log("🌱  Seeding users...");
  for (const { email, password, role } of seedUsers) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, role },
    });
    console.log(`    ✓ ${email} (${role})`);
  }

  // Clear domain data so re-runs are idempotent
  console.log("🌱  Clearing existing domain data...");
  await prisma.notificationHistory.deleteMany({});
  await prisma.borrowingReturn.deleteMany({});
  await prisma.equipmentItemReturnHistory.deleteMany({});
  await prisma.borrowingRequestStatusHistory.deleteMany({});
  await prisma.equipmentItemStatusHistory.deleteMany({});
  // Break circular FK before deleting requests / equipment
  await prisma.equipmentItem.updateMany({ data: { currentLoanRequestId: null } });
  await prisma.borrowingRequest.deleteMany({});
  await prisma.equipmentItem.deleteMany({});
  await prisma.medicalAssessment.deleteMany({});
  await prisma.mediaAsset.deleteMany({});
  await prisma.patient.deleteMany({});

  console.log("🌱  Seeding equipment items...");
  for (const item of equipmentItemData) {
    await prisma.equipmentItem.create({ data: item });
  }
  console.log(`    ✓ ${equipmentItemData.length} items across 9 types`);

  console.log("🌱  Seeding patients...");
  for (const p of patientData) {
    await prisma.patient.create({ data: p });
  }
  console.log(`    ✓ ${patientData.length} patients`);

  console.log("🌱  Seeding medical assessments...");
  for (const a of medicalAssessmentData) {
    await prisma.medicalAssessment.create({ data: a });
  }

  console.log("🌱  Seeding borrowing requests...");
  for (const r of borrowingRequestData) {
    await prisma.borrowingRequest.create({ data: r });
  }
  console.log(`    ✓ ${borrowingRequestData.length} requests (statuses: closed, awaiting_return, delivered, preparing_delivery, approved, inventory_check, ai_recommended, received)`);

  // Set currentLoanRequestId on equipment items that are still on loan
  console.log("🌱  Linking active loans to equipment...");
  const activeLoanMap = {
    "equip-wk-001": "req-002",   // awaiting_return
    "equip-bed-003": "req-003",  // delivered
    "equip-wc-002": "req-004",   // preparing_delivery
    "equip-ox-001": "req-005",   // approved
  };
  for (const [equipId, reqId] of Object.entries(activeLoanMap)) {
    await prisma.equipmentItem.update({
      where: { id: equipId },
      data: { currentLoanRequestId: reqId },
    });
  }

  console.log("🌱  Seeding status histories...");
  for (const h of statusHistories) {
    await prisma.borrowingRequestStatusHistory.create({ data: h });
  }
  for (const h of equipmentStatusHistories) {
    await prisma.equipmentItemStatusHistory.create({ data: h });
  }

  console.log("🌱  Seeding return records...");
  for (const r of borrowingReturnData) {
    await prisma.borrowingReturn.create({ data: r });
  }
  for (const r of equipmentReturnHistoryData) {
    await prisma.equipmentItemReturnHistory.create({ data: r });
  }

  console.log("🌱  Seeding notification histories...");
  for (const n of notificationData) {
    await prisma.notificationHistory.create({ data: n });
  }
  console.log(`    ✓ ${notificationData.length} notifications`);

  console.log("\n✅  Seed complete.");
  console.log("\n📋  Login credentials:");
  console.log("    admin@med-borrow.local   /  Admin1234!   (ADMIN)");
  console.log("    staff@med-borrow.local   /  Staff1234!   (STAFF)");
  console.log("    nurse@med-borrow.local   /  Staff@12345  (STAFF)");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
