"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
    const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin123!";
    const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
    });
    if (!existingAdmin) {
        const hashedPassword = await bcrypt_1.default.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                name: "Administrator",
                email: adminEmail,
                password: hashedPassword,
                role: "ADMIN"
            }
        });
        console.log(`Created admin user: ${adminEmail}`);
    }
    else {
        console.log(`Admin user already exists: ${adminEmail}`);
    }
}
main()
    .catch((error) => {
    console.error(error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map