import express, { type Router } from "express";
import UserRoutes from "../modules/user/user.routes";
import AuthRoutes from "../modules/auth/auth.routes";
import BannerRoutes from "../modules/banner/banner.routes";
import NewsRoutes from "../modules/news/news.routes";
import CommentRoutes from "../modules/comment/comment.routes";
const router = express.Router();

export const apiRoutes: Array<{ path: string; route: Router }> = [
  { path: "/user", route: UserRoutes },
  { path: "/auth", route: AuthRoutes },
  { path: "/banner", route: BannerRoutes },
  { path: "/news", route: NewsRoutes },
  { path: "/comment", route: CommentRoutes },
];

apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
