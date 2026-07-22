import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Ensure Sales User exists
  const salesEmail = "qwertyuiop@gmail.com";
  const hashedPassword = await bcrypt.hash("Password123!", 10);

  let salesUser = await prisma.user.findUnique({
    where: { email: salesEmail }
  });

  if (!salesUser) {
    salesUser = await prisma.user.create({
      data: {
        name: "lili",
        email: salesEmail,
        password: hashedPassword,
        role: "SALES"
      }
    });
    console.log(`Created sales user: ${salesEmail}`);
  }

  // 2. Ensure Admin User exists
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        name: "Administrator",
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN"
      }
    });
  }

  // 3. Initial Customers from UI screenshot
  const initialCustomers = [
    {
      name: "Rajesh Sharma",
      businessName: "TechCorp Solutions Pvt Ltd",
      phone: "+91 98765 43210",
      email: "rajesh@techcorp.in",
      gst: "27AAAAA0000A1Z5",
      type: "WHOLESALE" as const,
      status: "ACTIVE" as const,
      followUpDate: new Date("2026-07-25T10:00:00Z"),
      notes: "Interested in bulk order next quarter."
    },
    {
      name: "Priya Verma",
      businessName: "Apex Retail Outlets",
      phone: "+91 98123 45678",
      email: "priya@apexretail.com",
      gst: "27BBBCA1111B1Z2",
      type: "RETAIL" as const,
      status: "ACTIVE" as const,
      followUpDate: new Date("2026-07-23T14:30:00Z"),
      notes: "Follow up regarding payment clearance."
    },
    {
      name: "Amit Patel",
      businessName: "Patel Trading House",
      phone: "+91 97654 32109",
      email: "amit@pateltrading.org",
      gst: "24CCCDE2222C1Z8",
      type: "DISTRIBUTOR" as const,
      status: "LEAD" as const,
      followUpDate: new Date("2026-07-24T11:00:00Z"),
      notes: "Requested product catalogue and pricing tiers."
    },
    {
      name: "Sunita Reddy",
      businessName: "Deccan Group",
      phone: "+91 99887 76655",
      email: "sunita@deccangroup.co.in",
      gst: "36DDDF3333D1Z9",
      type: "WHOLESALE" as const,
      status: "ACTIVE" as const,
      followUpDate: null,
      notes: "Key client for southern region operations."
    },
    {
      name: "Vikram Mehta",
      businessName: "Mehta Enterprises",
      phone: "+91 91234 56789",
      email: "vikram@mehtaenterprises.com",
      gst: "07EEEFG4444E1Z1",
      type: "RETAIL" as const,
      status: "LEAD" as const,
      followUpDate: new Date("2026-07-28T09:00:00Z"),
      notes: "Initial discovery call completed."
    }
  ];

  const createdCustomers: Record<string, string> = {};

  for (const c of initialCustomers) {
    const existing = await prisma.customer.findFirst({
      where: { name: c.name }
    });
    if (!existing) {
      const created = await prisma.customer.create({ data: c });
      createdCustomers[c.name] = created.id;
      console.log(`Created customer: ${c.name}`);
    } else {
      createdCustomers[c.name] = existing.id;
    }
  }

  // 4. Sample Products
  const sampleProducts = [
    { name: "ERP System License", sku: "SKU-ERP-001", category: "Software", price: 45000, currentStock: 100, minimumStock: 10, warehouse: "Main Warehouse" },
    { name: "CRM Pro Module", sku: "SKU-CRM-002", category: "Software", price: 25000, currentStock: 150, minimumStock: 15, warehouse: "Main Warehouse" },
    { name: "POS Terminal Unit", sku: "SKU-POS-003", category: "Hardware", price: 12500, currentStock: 45, minimumStock: 5, warehouse: "East Depot" },
    { name: "Thermal Receipt Printer", sku: "SKU-PRT-004", category: "Hardware", price: 6500, currentStock: 80, minimumStock: 10, warehouse: "East Depot" }
  ];

  const createdProducts: Record<string, any> = {};
  for (const p of sampleProducts) {
    const existing = await prisma.product.findUnique({ where: { sku: p.sku } });
    if (!existing) {
      const created = await prisma.product.create({ data: p });
      createdProducts[p.sku] = created;
    } else {
      createdProducts[p.sku] = existing;
    }
  }

  // 5. Initial Challans matching screenshot
  const initialChallans = [
    {
      challanNumber: "SCH-2026-001",
      customerName: "Rajesh Sharma",
      status: "CONFIRMED" as const,
      createdAt: new Date("2026-07-21T09:30:00Z"),
      items: [
        { productName: "ERP System License", sku: "SKU-ERP-001", category: "Software", price: 45000, quantity: 2 },
        { productName: "CRM Pro Module", sku: "SKU-CRM-002", category: "Software", price: 25000, quantity: 4 }
      ]
    },
    {
      challanNumber: "SCH-2026-002",
      customerName: "Priya Verma",
      status: "DRAFT" as const,
      createdAt: new Date("2026-07-22T11:15:00Z"),
      items: [
        { productName: "POS Terminal Unit", sku: "SKU-POS-003", category: "Hardware", price: 12500, quantity: 10 },
        { productName: "Thermal Receipt Printer", sku: "SKU-PRT-004", category: "Hardware", price: 6500, quantity: 10 }
      ]
    },
    {
      challanNumber: "SCH-2026-003",
      customerName: "Sunita Reddy",
      status: "CONFIRMED" as const,
      createdAt: new Date("2026-07-20T16:45:00Z"),
      items: [
        { productName: "POS Terminal Unit", sku: "SKU-POS-003", category: "Hardware", price: 12500, quantity: 12 }
      ]
    },
    {
      challanNumber: "SCH-2026-004",
      customerName: "Amit Patel",
      status: "CANCELLED" as const,
      createdAt: new Date("2026-07-19T14:20:00Z"),
      items: [
        { productName: "CRM Pro Module", sku: "SKU-CRM-002", category: "Software", price: 25000, quantity: 5 }
      ]
    }
  ];

  for (const ch of initialChallans) {
    const existing = await prisma.challan.findUnique({
      where: { challanNumber: ch.challanNumber }
    });
    if (!existing) {
      const customerId = createdCustomers[ch.customerName];
      if (customerId) {
        await prisma.challan.create({
          data: {
            challanNumber: ch.challanNumber,
            customerId: customerId,
            status: ch.status,
            createdById: salesUser.id,
            createdAt: ch.createdAt,
            items: {
              create: ch.items.map(item => ({
                productName: item.productName,
                sku: item.sku,
                category: item.category,
                price: item.price,
                quantity: item.quantity,
                productId: createdProducts[item.sku]?.id
              }))
            }
          }
        });
        console.log(`Created challan: ${ch.challanNumber}`);
      }
    }
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
