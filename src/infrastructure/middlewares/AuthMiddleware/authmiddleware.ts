import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { CompanyModel } from "../../../adapters/persistence/models/companies/register/companyinfo";

export const maxAge = 3 * 60 * 60;

export const createToken = (id: any): string => {
  return jwt.sign({ id }, env.JWT_SECRET, {
    expiresIn: maxAge,
  });
};

export const GetrequireAuth = (req: Request, res: Response): any => {
  let token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ error: "Not Authenticated" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    async (err: any, decodedToken: any) => {
      if (err) {
        console.log(err.message);
        return res.status(401).json({ error: "Invalid Token" });
      } else {
        try {
          const user = await CompanyModel.findById(decodedToken.id);
          if (!user) {
            return res.status(404).json({ error: "User not found" });
          }
          return res.status(200).json({ user });
        } catch (e: any) {
          return res.status(400).json({ error: e.message });
        }
      }
    },
  );
};

export const PostrequireAuth = async (
  req: Request,
  res: Response,
): Promise<any> => {
  const { email, password } = req.body;
  try {
    const user = await CompanyModel.login(email, password);
    const logintoken = createToken(user._id);
    res.cookie("jwt", logintoken, {
      httpOnly: true,
      maxAge: maxAge * 1000,
      secure: true,
      sameSite: "none",
      path: "/",
    });
    return res.status(200).json({
      _id: user._id,
    });
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }
};

export const LogoutUser = (req: Request, res: Response): any => {
  res.cookie("jwt", "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};
