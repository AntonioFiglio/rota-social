import { ReactElement, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useVolunteerStore } from "./store/useVolunteer";

const OnboardingSelectVolunteer = lazy(
  () => import("./pages/OnboardingSelectVolunteer"),
);
const Overview = lazy(() => import("./pages/Overview"));
const Cases = lazy(() => import("./pages/Cases"));
const Search = lazy(() => import("./pages/Search"));
const StudentDetails = lazy(() => import("./pages/StudentDetails"));

type AppRoutesProps = {
  layout: ReactElement;
};

const AppRoutes = ({ layout }: AppRoutesProps) => {
  const volunteer = useVolunteerStore((state) => state.volunteer);

  return (
    <Routes>
      <Route path="/onboarding" element={<OnboardingSelectVolunteer />} />

      <Route
        path="/"
        element={volunteer ? layout : <Navigate to="/onboarding" replace />}
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Overview />} />
        <Route path="cases" element={<Cases />} />
        <Route path="search" element={<Search />} />
        <Route path="students/:id" element={<StudentDetails />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
