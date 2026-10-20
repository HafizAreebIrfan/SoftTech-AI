import { Request, Response, NextFunction } from "express";

export function errorMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
  console.error(err.message);

  let statusCode = 400;
  let message = err.message || "Something went wrong";

  // Handle MongoDB E11000 duplicate key errors
  if (err.code === 11000 || err.message?.includes("E11000")) {
    statusCode = 409; // Conflict
    const fieldMatch = err.message?.match(/{ (\w+):/);
    const field = fieldMatch ? fieldMatch[1] : "field";
    const fieldLabel = formatFieldName(field);
    message = `${fieldLabel} already exists. Please use a different ${fieldLabel.toLowerCase()}.`;
  }

  // Handle validation errors
  if (err.name === "ValidationError") {
    statusCode = 422;
    const errors = Object.values(err.errors).map((e: any) => e.message);
    message = errors.length > 0 ? errors[0] : "Validation failed";
  }

  // Handle custom validation messages from use cases
  if (message.includes("companyId is required")) {
    statusCode = 400;
    message = "Company ID is missing. Please provide a valid company ID.";
  }

  if (message.includes("apis must be a non-empty array")) {
    statusCode = 422;
    message = "Please provide at least one API configuration.";
  }

  if (message.includes("uiPreference is required")) {
    statusCode = 422;
    message = "Please select a UI preference to continue.";
  }

  if (message.includes("not found")) {
    statusCode = 404;
    message = "The requested resource was not found.";
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

function formatFieldName(field: string): string {
  const fieldNames: { [key: string]: string } = {
    email: "Email",
    username: "Username",
    companyname: "Company name",
    phone: "Phone number",
  };
  return fieldNames[field.toLowerCase()] || field.charAt(0).toUpperCase() + field.slice(1);
}
