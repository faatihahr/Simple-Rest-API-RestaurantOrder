import pkg from '@prisma/client';
import type { PrismaClient as PrismaClientType } from '@prisma/client';

const { PrismaClient } = pkg as any;

const prisma: PrismaClientType = new PrismaClient();

async function main() {
  // Seed categories
  const food = await prisma.category.upsert({
    where: { name: 'Food' },
    update: {},
    create: { name: 'Food' },
  });

  const beverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages' },
  });

  // Seed products
  const pizza = await prisma.products.upsert({
    where: { id: 1 },
    update: {},
    create: {
      categoryId: food.id,
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato sauce, mozzarella, and basil',
      price: 12.99,
    },
  });

  const burger = await prisma.products.upsert({
    where: { id: 2 },
    update: {},
    create: {
      categoryId: food.id,
      name: 'Cheeseburger',
      description: 'Juicy beef patty with cheese, lettuce, and tomato',
      price: 9.99,
    },
  });

  const coffee = await prisma.products.upsert({
    where: { id: 3 },
    update: {},
    create: {
      categoryId: beverages.id,
      name: 'Espresso',
      description: 'Strong and rich coffee',
      price: 3.50,
    },
  });

  const juice = await prisma.products.upsert({
    where: { id: 4 },
    update: {},
    create: {
      categoryId: beverages.id,
      name: 'Orange Juice',
      description: 'Freshly squeezed orange juice',
      price: 4.00,
    },
  });

  // Seed images
  await prisma.images.upsert({
    where: { id: 'img1' },
    update: {},
    create: {
      productId: pizza.id,
      url: 'https://example.com/pizza.jpg',
    },
  });

  await prisma.images.upsert({
    where: { id: 'img2' },
    update: {},
    create: {
      productId: burger.id,
      url: 'https://example.com/burger.jpg',
    },
  });

  await prisma.images.upsert({
    where: { id: 'img3' },
    update: {},
    create: {
      productId: coffee.id,
      url: 'https://example.com/coffee.jpg',
    },
  });

  await prisma.images.upsert({
    where: { id: 'img4' },
    update: {},
    create: {
      productId: juice.id,
      url: 'https://example.com/juice.jpg',
    },
  });

  // Delete existing orders and items
  await prisma.orderItems.deleteMany({});
  await prisma.orders.deleteMany({});

  // Seed orders
  await prisma.orders.create({
    data: {
      totalPrice: 25.98 + 9.99, // pizza x2 + burger x1
      items: {
        create: [
          {
            productId: pizza.id,
            quantity: 2,
            price: pizza.price * 2
          },
          {
            productId: burger.id,
            quantity: 1,
            price: burger.price
          }
        ]
      }
    },
  });

  await prisma.orders.create({
    data: {
      totalPrice: 3.50 + 4.00, // coffee x1 + juice x1
      items: {
        create: [
          {
            productId: coffee.id,
            quantity: 1,
            price: coffee.price
          },
          {
            productId: juice.id,
            quantity: 1,
            price: juice.price
          }
        ]
      }
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
