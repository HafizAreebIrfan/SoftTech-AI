import mongoose from "mongoose";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { CompanyModel } from "../src/adapters/persistence/models/companies/register/companyinfo";

async function inspect() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("MONGO_URI missing");
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB.");

  const companies = await CompanyModel.find({}).lean();
  for (const c of companies) {
    console.log(`\n========================================`);
    console.log(`Company: "${c.companyName}" (ID: ${c._id}, slug: ${c.mcpSlug})`);
    console.log(`APIs count: ${c.apis?.length}`);
    (c.apis || []).forEach((api: any, i: number) => {
      console.log(`\n  API #${i + 1}: "${api.name || api.endpoint}" (${api.method})`);
      console.log(`    mcpToolName: ${api.mcpToolName}`);
      console.log(`    mcpDescription: ${api.mcpDescription}`);
      console.log(`    isWidgetEnabled: ${api.isWidgetEnabled}`);
      console.log(`    uiConfig: ${JSON.stringify(api.uiConfig)}`);
      console.log(`    apiSchema: ${api.apiSchema ? JSON.stringify(api.apiSchema).substring(0, 150) + "..." : "NULL / UNDEFINED"}`);
      console.log(`    inputFieldMap: ${JSON.stringify(api.inputFieldMap)}`);
      console.log(`    outputFieldMap: ${JSON.stringify(api.outputFieldMap)}`);
      console.log(`    sampleresponse present: ${Boolean(api.sampleresponse || api.sampleResponse)}`);
    });
  }

  await mongoose.disconnect();
}

inspect().catch(console.error);
