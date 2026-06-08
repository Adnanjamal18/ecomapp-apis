import { prisma } from "../src/config/db.js";

async function main() {
  console.log("Starting to seed premium products... 🚀");
  
  let admin = await prisma.user.findFirst();
  
  if (!admin) {
    admin = await prisma.user.create({
        data: {
            name: "Store Admin",
            email: "admin@neoshop.com",
            password: "dummy_password", 
            role: "ADMIN"
        }
    });
    console.log("Naya Admin User create kiya gaya:", admin.name);
  } else {
    console.log("User mila:", admin.name);
  }

  const productsData = [
    {
      name: "MacBook Pro 16\"",
      description: "M3 Max, 36GB RAM, 1TB SSD. The ultimate coding machine for developers.",
      price: 2499.99,
      stock: 10,
      createdBy: admin.id
    },
    {
      name: "iPhone 15 Pro",
      description: "Beautiful Titanium design, A17 Pro chip, Action button.",
      price: 999.00,
      stock: 50,
      createdBy: admin.id
    },
    {
      name: "Sony WH-1000XM5",
      description: "Industry leading noise canceling headphones. Enjoy the silence.",
      price: 348.00,
      stock: 25,
      createdBy: admin.id
    },
    {
      name: "Keychron K2 Mechanical Keyboard",
      description: "75% layout wireless mechanical keyboard with tactile switches.",
      price: 89.99,
      stock: 100,
      createdBy: admin.id
    },
    {
      name: "LG UltraGear 27\" Monitor",
      description: "144Hz, 1ms, Nano IPS Display for the perfect development setup.",
      price: 299.99,
      stock: 15,
      createdBy: admin.id
    }
  ];

  console.log("Products add ho rahe hain...");
  for (const p of productsData) {
    await prisma.product.create({ data: p });
    console.log(`✅ Added: ${p.name}`);
  }

  console.log("Seeding bilkul complete! 🎉 Ab frontend refresh karein!");
}

main()
  .catch(e => {
      console.error("Koi error aagaya seeding mein:", e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });