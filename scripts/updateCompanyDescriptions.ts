import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { CompanyModel } from "../src/adapters/persistence/models/companies/register/companyinfo";
import { generateMcpDescription } from "../src/infrastructure/mcp/tools/RegisterCompanyTools/mcpDescriptionGenerator";

async function runMigration() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI is missing from environment variables.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB Atlas.");

  const companies = await CompanyModel.find({});
  console.log(`Found ${companies.length} companies to evaluate.`);

  let totalUpdatedApis = 0;
  let totalUpdatedCompanies = 0;

  for (const company of companies) {
    let companyModified = false;
    const apis = (company.apis || []) as any[];

    apis.forEach((api, index) => {
      const oldDesc = api.mcpDescription || "";
      const newDesc = generateMcpDescription(
        api,
        {
          companyName: company.companyName,
          industry: company.industry,
        },
        { forceRegenerate: true },
      );

      const isWidgetEnabled =
        api.isWidgetEnabled !== undefined
          ? Boolean(api.isWidgetEnabled)
          : (api.uiConfig?.uiEnabled !== false);

      const oldWidgetEnabled = api.isWidgetEnabled;

      if (oldDesc !== newDesc || oldWidgetEnabled !== isWidgetEnabled) {
        console.log(`\n🏢 [${company.companyName}] API #${index + 1}: "${api.name || api.endpoint}"`);
        if (oldDesc !== newDesc) {
          console.log(`  Old Desc: "${oldDesc.substring(0, 70)}..."`);
          console.log(`  New Desc: "${newDesc}"`);
          api.mcpDescription = newDesc;
        }
        api.isWidgetEnabled = isWidgetEnabled;
        if (!api.uiConfig) {
          api.uiConfig = { uiEnabled: isWidgetEnabled, uiType: "auto", mapEnabled: false };
        } else {
          api.uiConfig.uiEnabled = isWidgetEnabled;
        }

        companyModified = true;
        totalUpdatedApis++;
      }
    });

    if (companyModified) {
      await CompanyModel.findByIdAndUpdate(company._id, {
        apis,
        updatedAt: new Date(),
      });
      totalUpdatedCompanies++;
      console.log(`✅ Updated company: "${company.companyName}" (${company.mcpSlug})`);
    } else {
      console.log(`ℹ️ No changes needed for: "${company.companyName}"`);
    }
  }

  console.log(`\n🎉 Migration Complete!`);
  console.log(`Total Companies Updated: ${totalUpdatedCompanies}/${companies.length}`);
  console.log(`Total APIs Updated: ${totalUpdatedApis}`);

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

runMigration().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
