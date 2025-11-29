import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// Create a singleton instance of PrismaClient with Accelerate
let prisma;

const createPrismaClient = () => {
  return new PrismaClient().$extends(withAccelerate());
};

if (process.env.NODE_ENV === 'production') {
  prisma = createPrismaClient();
} else {
  // In development, use a global variable to preserve the value across module reloads
  if (!global.__prisma) {
    global.__prisma = createPrismaClient();
  }
  prisma = global.__prisma;
}

export { prisma };
export default prisma;
