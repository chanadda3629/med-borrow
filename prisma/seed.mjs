import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

async function main() {
  for (const group of referenceGroups) {
    for (const [sortOrder, [code, label]] of group.items.entries()) {
      await prisma.referenceValue.upsert({
        where: {
          category_code: {
            category: group.category,
            code,
          },
        },
        update: {
          label,
          sortOrder,
          isActive: true,
        },
        create: {
          category: group.category,
          code,
          label,
          sortOrder,
        },
      });
    }
  }
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
