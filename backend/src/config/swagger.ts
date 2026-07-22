import swaggerJSDoc from "swagger-jsdoc";

const options: any = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "FundsRoom API",
      version: "0.1.0",
      description: "Mini ERP + CRM API"
    },
    servers: [{ url: "/api", description: "API root" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string" },
            role: { type: "string" }
          }
        },
        Customer: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            businessName: { type: "string" },
            email: { type: "string" },
            phone: { type: "string" },
            address: { type: "string" },
            status: { type: "string" }
          }
        },
        Product: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            sku: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            currentStock: { type: "number" }
          }
        },
        StockMovement: {
          type: "object",
          properties: {
            id: { type: "string" },
            productId: { type: "string" },
            type: { type: "string" },
            quantity: { type: "number" },
            note: { type: "string" }
          }
        },
        ChallanItem: {
          type: "object",
          properties: {
            id: { type: "string" },
            productId: { type: "string" },
            productName: { type: "string" },
            sku: { type: "string" },
            category: { type: "string" },
            price: { type: "number" },
            quantity: { type: "number" }
          }
        },
        Challan: {
          type: "object",
          properties: {
            id: { type: "string" },
            challanNumber: { type: "string" },
            customerId: { type: "string" },
            status: { type: "string" },
            items: { type: "array", items: { $ref: "#/components/schemas/ChallanItem" } }
          }
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            errors: { type: "array", items: { type: "string" } }
          }
        },
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object" }
          }
        }
      }
    }
  },
  apis: ["src/routes/*.ts", "src/controllers/*.ts"]
};

export const swaggerSpec = swaggerJSDoc(options);
