import type { PrismaClient as PrismaClientType } from '@prisma/client';
import { PrismaClient } from '@prisma/client';

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

  // Seed tables (meja)
  const table1 = await prisma.meja.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Table 1',
      isAvailable: true,
    },
  });

  const table2 = await prisma.meja.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'Table 2',
      isAvailable: true,
    },
  });

  // Seed users
  const user1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      password: 'hashedpassword123', // hash dilakukan di real app
      point: 100,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'hashedpassword456',
      point: 50,
    },
  });

  // Seed user favorites
  await prisma.user_favorites.upsert({
    where: { userId_productId: { userId: user1.id, productId: pizza.id } },
    update: {},
    create: {
      userId: user1.id,
      productId: pizza.id,
    },
  });

  await prisma.user_favorites.upsert({
    where: { userId_productId: { userId: user1.id, productId: coffee.id } },
    update: {},
    create: {
      userId: user1.id,
      productId: coffee.id,
    },
  });

  await prisma.user_favorites.upsert({
    where: { userId_productId: { userId: user2.id, productId: burger.id } },
    update: {},
    create: {
      userId: user2.id,
      productId: burger.id,
    },
  });

  // Delete existing orders and items
  await prisma.orderItems.deleteMany({});
  await prisma.orders.deleteMany({});

  // Seed orders 
  const order1 = await prisma.orders.create({
    data: {
      tableId: table1.id,
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

  const order2 = await prisma.orders.create({
    data: {
      tableId: table2.id,
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

  const order3 = await prisma.orders.create({
    data: {
      userId: user2.id,
      tableId: table2.id,
      totalPrice: 9.99 + 4.00, // burger x1 + juice x1
      items: {
        create: [
          {
            productId: burger.id,
            quantity: 1,
            price: burger.price
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

  // Seed user reviews
  await prisma.user_reviews.create({
    data: {
      userId: user1.id,
      productId: pizza.id,
      orderId: order1.id,
      rating: 5,
      comment: 'Amazing pizza! Will order again.',
    },
  });

  await prisma.user_reviews.create({
    data: {
      userId: user1.id,
      productId: burger.id,
      orderId: order1.id,
      rating: 4,
      comment: 'Good burger, but could be juicier.',
    },
  });

  await prisma.user_reviews.create({
    data: {
      userId: user2.id,
      productId: coffee.id,
      orderId: order2.id,
      rating: 5,
      comment: 'Perfect espresso, strong and flavorful.',
    },
  });

  await prisma.user_reviews.create({
    data: {
      userId: user2.id,
      productId: juice.id,
      orderId: order2.id,
      rating: 4,
      comment: 'Fresh juice, but a bit too sweet.',
    },
  });

  // Seed suppliers
  const supplierA = await prisma.supplier.upsert({
    where: { name: 'Acme Supplies' },
    update: {},
    create: { name: 'Acme Supplies' },
  });

  const supplierB = await prisma.supplier.upsert({
    where: { name: 'Fresh Farm' },
    update: {},
    create: { name: 'Fresh Farm' },
  });

  // Seed stocks (create if not exists)
  let flour = await prisma.stock.findFirst({ where: { name: 'Flour' } });
  if (!flour) {
    flour = await prisma.stock.create({
      data: {
        name: 'Flour',
        quantity: 100,
        unit: 'kg',
        supplierId: supplierA.id,
      },
    });
  }

  let tomato = await prisma.stock.findFirst({ where: { name: 'Tomato' } });
  if (!tomato) {
    tomato = await prisma.stock.create({
      data: {
        name: 'Tomato',
        quantity: 200,
        unit: 'kg',
        supplierId: supplierB.id,
      },
    });
  }

  // seed product stocks (associating stocks with products)
  await prisma.productStock.upsert({
    where: { productId_stockId: { productId: pizza.id, stockId: flour.id } },
    update: {},
    create: { productId: pizza.id, stockId: flour.id, quantityRequired: 0.5 },
  });

  await prisma.productStock.upsert({
    where: { productId_stockId: { productId: pizza.id, stockId: tomato.id } },
    update: {},
    create: { productId: pizza.id, stockId: tomato.id, quantityRequired: 0.2 },
  });

  await prisma.productStock.upsert({
    where: { productId_stockId: { productId: burger.id, stockId: flour.id } },
    update: {},
    create: { productId: burger.id, stockId: flour.id, quantityRequired: 0.3 },
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
