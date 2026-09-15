import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { CompanyModel } from "../src/adapters/persistence/models/companies/register/companyinfo";
import { analyzeApiResponse } from "../src/infrastructure/mcp/schema_analyzer/analyzer";
import { generateMcpDescription } from "../src/infrastructure/mcp/tools/RegisterCompanyTools/mcpDescriptionGenerator";
import { buildInputFieldMap, buildOutputFieldMap } from "../src/application/useCases/company/register/companyapidetails";

// Sample responses for common Car Rental endpoints if live API is temporarily unavailable
const FALLBACK_SAMPLES: Record<string, any> = {
  cars: {
    status: "success",
    data: [
      {
        id: "car_101",
        make: "Toyota",
        model: "Fortuner",
        variant: "Legender 4x4",
        year: 2024,
        color: "Pearl White",
        fuelType: "DIESEL",
        transmission: "AUTOMATIC",
        seats: 7,
        doors: 5,
        dailyRate: 25000,
        weeklyRate: 150000,
        monthlyRate: 550000,
        depositAmount: 50000,
        status: "AVAILABLE",
        city: "Karachi",
        branch: "Karachi Airport",
        images: ["https://images.unsplash.com/photo-1533473359331-0135ef1b58bf"],
      },
      {
        id: "car_102",
        make: "Toyota",
        model: "Corolla Altis",
        variant: "Grande 1.8",
        year: 2023,
        color: "Super White",
        fuelType: "PETROL",
        transmission: "AUTOMATIC",
        seats: 5,
        doors: 4,
        dailyRate: 9500,
        depositAmount: 25000,
        status: "AVAILABLE",
        city: "Karachi",
        branch: "Clifton Branch",
        images: ["https://images.unsplash.com/photo-1549399542-7e3f8b79c341"],
      },
      {
        id: "car_103",
        make: "Kia",
        model: "Sportage",
        variant: "AWD",
        year: 2024,
        color: "Mercury Silver",
        fuelType: "PETROL",
        transmission: "AUTOMATIC",
        seats: 5,
        doors: 5,
        dailyRate: 18000,
        depositAmount: 35000,
        status: "AVAILABLE",
        city: "Lahore",
        branch: "DHA Branch",
        images: ["https://images.unsplash.com/photo-1583121274602-3e2820c69888"],
      },
    ],
  },
  availability: {
    status: "success",
    isAvailable: true,
    availableUnits: 2,
    carId: "car_101",
    startDate: "2026-10-01",
    endDate: "2026-10-05",
    dailyRate: 25000,
    totalEstimatedCost: 100000,
  },
  locations: {
    status: "success",
    data: [
      {
        id: "loc_1",
        name: "Karachi Airport Branch",
        city: "Karachi",
        address: "Jinnah International Airport, Terminal 1",
        phone: "+92 21 111 222 333",
        latitude: 24.9073,
        longitude: 67.1608,
      },
      {
        id: "loc_2",
        name: "Lahore DHA Branch",
        city: "Lahore",
        address: "Phase 5 Commercial, DHA",
        phone: "+92 42 111 222 333",
        latitude: 31.4697,
        longitude: 74.3768,
      },
      {
        id: "loc_3",
        name: "Islamabad Blue Area Branch",
        city: "Islamabad",
        address: "Jinnah Avenue, Blue Area",
        phone: "+92 51 111 222 333",
        latitude: 33.7142,
        longitude: 73.0617,
      },
    ],
  },
  bookings: {
    status: "success",
    data: [
      {
        id: "bk_9901",
        bookingNumber: "CRP-2026-9901",
        carModel: "Toyota Fortuner Legender",
        startDate: "2026-09-20",
        endDate: "2026-09-25",
        status: "CONFIRMED",
        totalAmount: 125000,
        pickupLocation: "Karachi Airport",
      },
    ],
  },
  profile: {
    status: "success",
    data: {
      userId: "usr_4401",
      name: "Areeb Irfan",
      email: "areeb@example.com",
      phone: "+92 300 1234567",
      tier: "VIP Gold",
      totalRentals: 12,
    },
  },
  reviews: {
    status: "success",
    data: [
      {
        id: "rev_1",
        carModel: "Toyota Fortuner",
        rating: 5,
        comment: "Excellent vehicle and seamless rental experience.",
        author: "Hamza S.",
        createdAt: "2026-08-15",
      },
    ],
  },
  analytics: {
    status: "success",
    totalSpent: 450000,
    totalBookings: 8,
    activeBookings: 1,
    loyaltyPoints: 2400,
  },
};

async function getSampleForApi(api: any): Promise<any> {
  const ep = String(api.endpoint || "").toLowerCase();
  const method = String(api.method || "GET").toUpperCase();

  // Try live fetch if GET endpoint
  if (method === "GET" && api.baseUrl && api.endpoint) {
    try {
      const fullUrl = api.baseUrl.replace(/\/+$/, "") + "/" + api.endpoint.replace(/^\/+/, "").replace(/\{[^}]+\}/g, "1");
      const resp = await fetch(fullUrl, {
        headers: {
          ...(api.authHeader ? { Authorization: api.authHeader } : {}),
          ...(api.bearerToken ? { Authorization: `Bearer ${api.bearerToken}` } : {}),
          ...(api.apiKey ? { "x-api-key": api.apiKey } : {}),
        },
      });
      if (resp.ok) {
        const json = await resp.json();
        console.log(`    ✓ Live API sample fetched from ${fullUrl}`);
        return json;
      }
    } catch (e) {
      // ignore
    }
  }

  // Fallback to intelligent mock
  if (ep.includes("availab")) return FALLBACK_SAMPLES.availability;
  if (ep.includes("location")) return FALLBACK_SAMPLES.locations;
  if (ep.includes("booking")) return FALLBACK_SAMPLES.bookings;
  if (ep.includes("profile") || ep.includes("user")) return FALLBACK_SAMPLES.profile;
  if (ep.includes("review") || ep.includes("rating")) return FALLBACK_SAMPLES.reviews;
  if (ep.includes("spend") || ep.includes("analytic")) return FALLBACK_SAMPLES.analytics;
  if (ep.includes("car")) return FALLBACK_SAMPLES.cars;

  return { status: "success", message: `${api.name} executed successfully.` };
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGO_URI missing");

  console.log("Connecting to MongoDB...");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const companies = await CompanyModel.find({});

  for (const company of companies) {
    console.log(`\nProcessing Company: "${company.companyName}" (${company.mcpSlug})`);
    const apis = (company.apis || []) as any[];

    for (let i = 0; i < apis.length; i++) {
      const api = apis[i];
      console.log(`  Evaluating API #${i + 1}: "${api.name || api.endpoint}" (${api.method})`);

      // 1. Build inputFieldMap
      api.inputFieldMap = buildInputFieldMap(api);

      // 2. Fetch sample and build schema if missing
      if (!api.apiSchema || !api.apiSchema.fields || api.apiSchema.fields.length === 0) {
        console.log(`    → Synthesizing schema for "${api.name}"...`);
        const sample = await getSampleForApi(api);
        api.sampleresponse = sample;
        api.sampleResponse = sample;

        try {
          const generatedSchema = await analyzeApiResponse(sample, {
            apiName: api.name,
            endpoint: api.endpoint,
            industry: company.industry,
          });
          api.apiSchema = generatedSchema as any;
          console.log(`    ✓ Schema generated (${generatedSchema?.fields?.length || 0} fields, entity: ${generatedSchema?.entity})`);
        } catch (err: any) {
          console.warn(`    ⚠️ Schema analysis warning: ${err.message}`);
        }
      }

      // 3. Build outputFieldMap from apiSchema
      api.outputFieldMap = buildOutputFieldMap(api);

      // 4. Synthesize description
      api.mcpDescription = generateMcpDescription(
        api,
        { companyName: company.companyName, industry: company.industry },
        { forceRegenerate: true },
      );

      console.log(`    • inputFieldMap count: ${api.inputFieldMap?.length || 0}`);
      console.log(`    • outputFieldMap count: ${api.outputFieldMap?.length || 0}`);
    }

    await CompanyModel.findByIdAndUpdate(company._id, {
      apis,
      updatedAt: new Date(),
    });
    console.log(`✅ Saved company "${company.companyName}" with schemas and field maps.`);
  }

  console.log("\n🎉 All companies successfully populated with schemas and field maps!");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
