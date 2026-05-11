import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, TransactionType } from "@prisma/client";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL ?? "",
});

const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "Ăn uống", type: TransactionType.expense },
  { name: "Hóa đơn", type: TransactionType.expense },
  { name: "Di chuyển", type: TransactionType.expense },
  { name: "Giải trí", type: TransactionType.expense },
  { name: "Lương", type: TransactionType.income },
  { name: "Thưởng", type: TransactionType.income },
];

const seed = async () => {
  for (const category of defaultCategories) {
    const existingCategory = await prisma.category.findFirst({
      where: {
        name: category.name,
        type: category.type,
        isDefault: true,
      },
      select: {
        id: true,
      },
    });

    if (existingCategory) {
      continue;
    }

    await prisma.category.create({
      data: {
        ...category,
        isDefault: true,
      },
    });
  }
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Failed to seed database:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
