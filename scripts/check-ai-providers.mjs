import { CreateCollectionCommand, DescribeCollectionCommand, RekognitionClient } from "@aws-sdk/client-rekognition";
import dotenv from "dotenv";
import { join } from "node:path";

dotenv.config({ path: join(process.cwd(), "BE", ".env") });

const [{ env }, { createTextResponse }] = await Promise.all([import("../BE/src/config/env.js"), import("../BE/src/modules/ai/openai.service.js")]);

const shouldCreateAwsCollection = process.argv.includes("--create-aws-collection");
const results = [];

async function checkOpenAi() {
  try {
    if (!env.openaiApiKey) {
      results.push({
        provider: "openai",
        ok: false,
        model: env.openaiModel,
        code: "missing_api_key",
        message: "OPENAI_API_KEY is not configured."
      });
      return;
    }

    const response = await createTextResponse({
      instructions: "Trả lời đúng một câu ngắn bằng tiếng Việt.",
      input: "Viết: BIZEN AI đã sẵn sàng demo.",
      maxOutputTokens: 80
    });

    results.push({
      provider: "openai",
      ok: Boolean(response?.output_text),
      model: env.openaiModel,
      sample: response?.output_text || ""
    });
  } catch (error) {
    results.push({
      provider: "openai",
      ok: false,
      model: env.openaiModel,
      status: error.status || null,
      code: error.code || error.type || "openai_error",
      message: error.message || "OpenAI check failed"
    });
  }
}

async function checkAwsRekognition() {
  try {
    const client = new RekognitionClient({ region: env.awsRegion });
    let status = "exists";

    try {
      await client.send(new DescribeCollectionCommand({ CollectionId: env.awsRekognitionCollectionId }));
    } catch (error) {
      if (error?.name !== "ResourceNotFoundException") throw error;
      if (!shouldCreateAwsCollection) {
        results.push({
          provider: "aws-rekognition",
          ok: false,
          region: env.awsRegion,
          collectionId: env.awsRekognitionCollectionId,
          code: "collection_missing",
          message: "Collection is missing. Re-run with --create-aws-collection to create it."
        });
        return;
      }

      await client.send(new CreateCollectionCommand({ CollectionId: env.awsRekognitionCollectionId }));
      status = "created";
    }

    results.push({
      provider: "aws-rekognition",
      ok: true,
      region: env.awsRegion,
      collectionId: env.awsRekognitionCollectionId,
      status
    });
  } catch (error) {
    results.push({
      provider: "aws-rekognition",
      ok: false,
      region: env.awsRegion,
      collectionId: env.awsRekognitionCollectionId,
      code: error.name || "aws_rekognition_error",
      message: error.message || "AWS Rekognition check failed"
    });
  }
}

await Promise.all([checkOpenAi(), checkAwsRekognition()]);

console.log(JSON.stringify(results, null, 2));

if (results.some((result) => !result.ok)) {
  process.exitCode = 1;
}
