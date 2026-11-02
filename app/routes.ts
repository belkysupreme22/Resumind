import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    index("routes/landing.tsx"),
    route('/auth', 'routes/auth.tsx'),
    layout('routes/protected.tsx', [
        route('/dashboard', 'routes/dashboard.tsx'),
        route('/upload', 'routes/upload.tsx'),
        route('/resume/:id', 'routes/resume.tsx'),
        route('/wipe', 'routes/wipe.tsx'),
    ]),
] satisfies RouteConfig;
