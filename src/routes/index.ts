import express from "express";
import UserRoutes from "../modules/user/user.routes";
import AuthRoutes from "../modules/auth/auth.routes";
import BannerRoutes from "../modules/banner/banner.routes";
const router = express.Router();

export const apiRoutes: { path: string; route: any }[] = [
  { path: "/user", route: UserRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/banner", route: BannerRoutes },
];

apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
