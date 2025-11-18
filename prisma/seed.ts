import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean up existing data (optional - comment out if you want to preserve data)
  console.log('🧹 Cleaning up existing data...');
  await prisma.refreshToken.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.document.deleteMany();
  await prisma.performanceReview.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.leave.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.position.deleteMany();
  await prisma.department.deleteMany();

  // Create departments
  console.log('📁 Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Engineering',
        code: 'ENG',
        description: 'Software development and engineering',
        budget: 5000000,
        location: 'Building A',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Human Resources',
        code: 'HR',
        description: 'Human resources management',
        budget: 1000000,
        location: 'Building B',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Finance',
        code: 'FIN',
        description: 'Financial management and accounting',
        budget: 2000000,
        location: 'Building B',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Marketing',
        code: 'MKT',
        description: 'Marketing and communications',
        budget: 1500000,
        location: 'Building C',
      },
    }),
    prisma.department.create({
      data: {
        name: 'Sales',
        code: 'SAL',
        description: 'Sales and business development',
        budget: 3000000,
        location: 'Building C',
      },
    }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // Create positions
  console.log('💼 Creating positions...');
  const positions = await Promise.all([
    prisma.position.create({
      data: {
        title: 'Software Engineer',
        code: 'SE',
        description: 'Software development and coding',
        department: 'Engineering',
        minSalary: 80000,
        maxSalary: 150000,
        requirements: 'Bachelor\'s degree in Computer Science or related field',
      },
    }),
    prisma.position.create({
      data: {
        title: 'Senior Software Engineer',
        code: 'SSE',
        description: 'Advanced software development and team leadership',
        department: 'Engineering',
        minSalary: 120000,
        maxSalary: 200000,
        requirements: '5+ years of experience in software development',
      },
    }),
    prisma.position.create({
      data: {
        title: 'HR Manager',
        code: 'HRM',
        description: 'Human resources management and administration',
        department: 'Human Resources',
        minSalary: 90000,
        maxSalary: 140000,
        requirements: 'Bachelor\'s degree in HR or related field, 3+ years experience',
      },
    }),
    prisma.position.create({
      data: {
        title: 'Financial Analyst',
        code: 'FA',
        description: 'Financial analysis and reporting',
        department: 'Finance',
        minSalary: 70000,
        maxSalary: 120000,
        requirements: 'Bachelor\'s degree in Finance or Accounting',
      },
    }),
    prisma.position.create({
      data: {
        title: 'Marketing Specialist',
        code: 'MS',
        description: 'Marketing campaigns and brand management',
        department: 'Marketing',
        minSalary: 60000,
        maxSalary: 100000,
        requirements: 'Bachelor\'s degree in Marketing or related field',
      },
    }),
  ]);

  console.log(`✅ Created ${positions.length} positions`);

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminPassword = await hashPassword('Admin@123456');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@hrm-system.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const adminEmployee = await prisma.employee.create({
    data: {
      employeeId: 'ADM001',
      userId: adminUser.id,
      firstName: 'System',
      lastName: 'Administrator',
      dateOfBirth: new Date('1985-01-01'),
      gender: 'OTHER',
      phone: '+1234567890',
      address: {
        street: '123 Admin Street',
        city: 'Tech City',
        state: 'CA',
        zipCode: '94000',
        country: 'USA',
      },
      department: 'Engineering',
      position: 'System Administrator',
      employmentType: 'FULL_TIME',
      startDate: new Date('2020-01-01'),
      salary: 150000,
      status: 'ACTIVE',
      emergencyContact: {
        name: 'Emergency Contact',
        relationship: 'Family',
        phone: '+1234567891',
      },
    },
  });

  console.log(`✅ Created admin user: ${adminUser.email}`);

  // Create HR user
  console.log('👤 Creating HR user...');
  const hrPassword = await hashPassword('HR@123456');
  const hrUser = await prisma.user.create({
    data: {
      email: 'hr@hrm-system.com',
      password: hrPassword,
      role: 'HR',
      isActive: true,
    },
  });

  const hrEmployee = await prisma.employee.create({
    data: {
      employeeId: 'HR001',
      userId: hrUser.id,
      firstName: 'Sarah',
      lastName: 'Johnson',
      dateOfBirth: new Date('1988-05-15'),
      gender: 'FEMALE',
      phone: '+1234567892',
      personalEmail: 'sarah.johnson@personal.com',
      address: {
        street: '456 HR Avenue',
        city: 'Tech City',
        state: 'CA',
        zipCode: '94001',
        country: 'USA',
      },
      department: 'Human Resources',
      position: 'HR Manager',
      employmentType: 'FULL_TIME',
      startDate: new Date('2021-03-15'),
      salary: 110000,
      status: 'ACTIVE',
      managerId: adminEmployee.id,
      emergencyContact: {
        name: 'John Johnson',
        relationship: 'Spouse',
        phone: '+1234567893',
      },
    },
  });

  console.log(`✅ Created HR user: ${hrUser.email}`);

  // Create sample employees
  console.log('👥 Creating sample employees...');
  const employeeData = [
    {
      email: 'john.doe@hrm-system.com',
      password: 'Employee@123',
      firstName: 'John',
      lastName: 'Doe',
      employeeId: 'EMP001',
      dateOfBirth: new Date('1990-06-15'),
      gender: 'MALE' as const,
      department: 'Engineering',
      position: 'Senior Software Engineer',
      salary: 130000,
    },
    {
      email: 'jane.smith@hrm-system.com',
      password: 'Employee@123',
      firstName: 'Jane',
      lastName: 'Smith',
      employeeId: 'EMP002',
      dateOfBirth: new Date('1992-08-22'),
      gender: 'FEMALE' as const,
      department: 'Engineering',
      position: 'Software Engineer',
      salary: 95000,
    },
    {
      email: 'mike.wilson@hrm-system.com',
      password: 'Employee@123',
      firstName: 'Mike',
      lastName: 'Wilson',
      employeeId: 'EMP003',
      dateOfBirth: new Date('1987-03-10'),
      gender: 'MALE' as const,
      department: 'Finance',
      position: 'Financial Analyst',
      salary: 85000,
    },
    {
      email: 'emily.brown@hrm-system.com',
      password: 'Employee@123',
      firstName: 'Emily',
      lastName: 'Brown',
      employeeId: 'EMP004',
      dateOfBirth: new Date('1994-11-28'),
      gender: 'FEMALE' as const,
      department: 'Marketing',
      position: 'Marketing Specialist',
      salary: 75000,
    },
    {
      email: 'david.lee@hrm-system.com',
      password: 'Employee@123',
      firstName: 'David',
      lastName: 'Lee',
      employeeId: 'EMP005',
      dateOfBirth: new Date('1989-07-19'),
      gender: 'MALE' as const,
      department: 'Sales',
      position: 'Sales Manager',
      salary: 100000,
    },
  ];

  for (const emp of employeeData) {
    const hashedPassword = await hashPassword(emp.password);
    const user = await prisma.user.create({
      data: {
        email: emp.email,
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: emp.employeeId,
        userId: user.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        dateOfBirth: emp.dateOfBirth,
        gender: emp.gender,
        phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        address: {
          street: `${Math.floor(Math.random() * 1000)} Main St`,
          city: 'Tech City',
          state: 'CA',
          zipCode: `${94000 + Math.floor(Math.random() * 100)}`,
          country: 'USA',
        },
        department: emp.department,
        position: emp.position,
        employmentType: 'FULL_TIME',
        startDate: new Date(2022 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 12), 1),
        salary: emp.salary,
        status: 'ACTIVE',
        managerId: adminEmployee.id,
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phone: `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
        },
      },
    });
  }

  console.log(`✅ Created ${employeeData.length} sample employees`);

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🎉 Database seeding completed successfully!            ║
║                                                           ║
║   Test Credentials:                                       ║
║   ────────────────                                        ║
║                                                           ║
║   Admin:                                                  ║
║   Email:    admin@hrm-system.com                          ║
║   Password: Admin@123456                                  ║
║                                                           ║
║   HR:                                                     ║
║   Email:    hr@hrm-system.com                             ║
║   Password: HR@123456                                     ║
║                                                           ║
║   Employee:                                               ║
║   Email:    john.doe@hrm-system.com                       ║
║   Password: Employee@123                                  ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
