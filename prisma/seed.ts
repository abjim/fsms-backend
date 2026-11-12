import {
  InvoiceStatus,
  PaymentProvider,
  PaymentStatus,
  Priority,
  PrismaClient,
  ServiceRequestStatus,
  UserRole,
  WorkOrderStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient();

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@fsms.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
const CUSTOMER_PASSWORD = 'Customer@123';
const TECHNICIAN_PASSWORD = 'Tech@1234';

// weekly availability: Saturday to Thursday, 09:00 to 18:00
const defaultWorkingSlots = [6, 0, 1, 2, 3, 4].map((dayOfWeek) => ({
  dayOfWeek,
  startTime: '09:00',
  endTime: '18:00',
}));

const clearDatabase = async () => {
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.serviceReport.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.technicianAvailability.deleteMany();
  await prisma.technicianProfile.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.user.deleteMany();
};

const main = async () => {
  console.log('Clearing old records...');
  await clearDatabase();

  const [adminHash, customerHash, techHash] = await Promise.all([
    bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(CUSTOMER_PASSWORD, SALT_ROUNDS),
    bcrypt.hash(TECHNICIAN_PASSWORD, SALT_ROUNDS),
  ]);

  console.log('Seeding admin user...');
  const admin = await prisma.user.create({
    data: {
      name: 'FSMS Master Admin',
      email: ADMIN_EMAIL.toLowerCase(),
      password: adminHash,
      phone: '01711000000',
      address: 'Gulshan-2, Dhaka',
      role: UserRole.ADMIN,
    },
  });

  console.log('Seeding service categories...');
  const categories = await Promise.all([
    prisma.serviceCategory.create({
      data: {
        name: 'HVAC and AC Repair',
        slug: 'hvac-ac-repair',
        description: 'Commercial and residential air conditioning maintenance and servicing',
        icon: 'snowflake',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: 'Electrical Systems',
        slug: 'electrical-systems',
        description: 'Wiring, circuit breakers, generator connections and lighting repairs',
        icon: 'zap',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: 'Plumbing and Drainage',
        slug: 'plumbing-drainage',
        description: 'Pipe leak repairs, fixture installations, and water pumps',
        icon: 'droplet',
      },
    }),
    prisma.serviceCategory.create({
      data: {
        name: 'Appliance Maintenance',
        slug: 'appliance-maintenance',
        description: 'Refrigerators, washing machines, and commercial kitchen units',
        icon: 'tool',
      },
    }),
  ]);

  console.log('Seeding technician accounts...');
  const techUser1 = await prisma.user.create({
    data: {
      name: 'Rahim Chowdhury',
      email: 'tech@fsms.com',
      password: techHash,
      phone: '01811223344',
      address: 'Mirpur-10, Dhaka',
      role: UserRole.TECHNICIAN,
    },
  });

  const techProfile1 = await prisma.technicianProfile.create({
    data: {
      userId: techUser1.id,
      bio: 'Senior certified technician with 8 years of industrial and domestic HVAC experience',
      skills: ['HVAC', 'Air Conditioner', 'Refrigeration', 'Chiller'],
      experienceYears: 8,
      hourlyRate: 600,
      city: 'Dhaka',
      serviceArea: 'Mirpur, Uttara, Gulshan',
      avgRating: 4.9,
      totalReviews: 12,
      availabilities: {
        create: defaultWorkingSlots,
      },
    },
  });

  const techUser2 = await prisma.user.create({
    data: {
      name: 'Kamal Hossain',
      email: 'kamal@fsms.com',
      password: techHash,
      phone: '01911223344',
      address: 'Dhanmondi, Dhaka',
      role: UserRole.TECHNICIAN,
    },
  });

  await prisma.technicianProfile.create({
    data: {
      userId: techUser2.id,
      bio: 'Licensed electrical technician with industrial certification in substation and commercial wiring',
      skills: ['Electrical', 'Wiring', 'Substation', 'Generator'],
      experienceYears: 6,
      hourlyRate: 500,
      city: 'Dhaka',
      serviceArea: 'Dhanmondi, Mohammadpur, Banani',
      avgRating: 4.8,
      totalReviews: 8,
      availabilities: {
        create: defaultWorkingSlots,
      },
    },
  });

  console.log('Seeding customer accounts...');
  const customer1 = await prisma.user.create({
    data: {
      name: 'Farhan Ahmed',
      email: 'customer@fsms.com',
      password: customerHash,
      phone: '01722334455',
      address: 'Road 11, Banani, Dhaka',
      role: UserRole.CUSTOMER,
    },
  });

  const customer2 = await prisma.user.create({
    data: {
      name: 'Nusrat Jahan',
      email: 'nusrat@fsms.com',
      password: customerHash,
      phone: '01733445566',
      address: 'Sector 4, Uttara, Dhaka',
      role: UserRole.CUSTOMER,
    },
  });

  console.log('Seeding sample service request and work order...');
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const serviceRequest1 = await prisma.serviceRequest.create({
    data: {
      customerId: customer1.id,
      categoryId: categories[0].id,
      title: 'Central AC Cooling Failure',
      description: 'The master compressor is running but no cooling inside office floor 3',
      priority: Priority.HIGH,
      status: ServiceRequestStatus.ASSIGNED,
      address: 'Road 11, Banani, Dhaka',
      city: 'Dhaka',
      preferredDate: tomorrow,
      preferredTime: '10:00',
      contactPhone: '01722334455',
    },
  });

  const workOrder1 = await prisma.workOrder.create({
    data: {
      serviceRequestId: serviceRequest1.id,
      technicianId: techProfile1.id,
      assignedById: admin.id,
      status: WorkOrderStatus.SCHEDULED,
      scheduledDate: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      adminNotes: 'Client reported urgent breakdown before company conference',
    },
  });

  console.log('Seeding completed historical service order with invoice and payment...');
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 2);

  const completedRequest = await prisma.serviceRequest.create({
    data: {
      customerId: customer1.id,
      categoryId: categories[1].id,
      title: 'Main Circuit Breaker Tripping',
      description: 'Breaker trips repeatedly whenever heavy appliances turn on',
      priority: Priority.MEDIUM,
      status: ServiceRequestStatus.ASSIGNED,
      address: 'Road 11, Banani, Dhaka',
      city: 'Dhaka',
      preferredDate: yesterday,
      preferredTime: '14:00',
      contactPhone: '01722334455',
    },
  });

  const completedWorkOrder = await prisma.workOrder.create({
    data: {
      serviceRequestId: completedRequest.id,
      technicianId: techProfile1.id,
      assignedById: admin.id,
      status: WorkOrderStatus.COMPLETED,
      scheduledDate: yesterday,
      startTime: '14:00',
      endTime: '16:00',
      completedAt: yesterday,
      technicianNotes: 'Replaced faulty 32A breaker and repaired oxidized neutral terminal',
    },
  });

  await prisma.serviceReport.create({
    data: {
      workOrderId: completedWorkOrder.id,
      technicianId: techProfile1.id,
      problemFound: 'Faulty 32A circuit breaker and loose neutral connection causing overheating',
      workSummary: 'Installed new Schneider 32A double pole breaker and tested insulation resistance',
      partsUsed: 'Schneider 32A MCB (1 unit), Copper lug (2 units)',
      laborHours: 2.0,
    },
  });

  const invoice = await prisma.invoice.create({
    data: {
      workOrderId: completedWorkOrder.id,
      customerId: customer1.id,
      invoiceNumber: 'INV-20261122-DEMO1',
      laborCost: 1200,
      partsCost: 800,
      tax: 100,
      totalAmount: 2100,
      status: InvoiceStatus.PAID,
      paidAt: yesterday,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      customerId: customer1.id,
      amount: 2100,
      currency: 'BDT',
      provider: PaymentProvider.SSLCOMMERZ,
      status: PaymentStatus.COMPLETED,
      transactionId: 'FSMS-DEMO-TRAN-001',
      gatewayResponse: JSON.stringify({ status: 'VALID', tran_id: 'FSMS-DEMO-TRAN-001', amount: '2100' }),
    },
  });

  await prisma.review.create({
    data: {
      workOrderId: completedWorkOrder.id,
      customerId: customer1.id,
      technicianId: techProfile1.id,
      rating: 5,
      comment: 'Very professional and punctual service. Fixed our electrical issue quickly!',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Demo Credentials:');
  console.log(`- Admin:      ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`- Customer:   customer@fsms.com / ${CUSTOMER_PASSWORD}`);
  console.log(`- Technician: tech@fsms.com / ${TECHNICIAN_PASSWORD}`);
};

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
