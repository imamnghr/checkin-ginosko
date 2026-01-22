import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  Login,
  Home,
  Coach,
  ScanCheckin,
  ListCheckin,
  ChooseExercise,
  Recepsionist,
  ScanCheckInRecept,
  ClaimReward,
} from "@pages";
import Protected from "@components/Protected";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default entry */}
        <Route path="/" element={<Navigate to="/home" replace />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/home"
          element={
            <Protected>
              <Home />
            </Protected>
          }
        />
        <Route
          path="/coach"
          element={
            <Protected>
              <Coach />
            </Protected>
          }
        />
        <Route
          path="/coach/scan-checkin"
          element={
            <Protected>
              <ScanCheckin />
            </Protected>
          }
        />
        <Route
          path="/coach/list-checkin"
          element={
            <Protected>
              <ListCheckin />
            </Protected>
          }
        />
        <Route
          path="/coach/choose-exercise"
          element={
            <Protected>
              <ChooseExercise />
            </Protected>
          }
        />
        <Route
          path="/recepsionist"
          element={
            <Protected>
              <Recepsionist />
            </Protected>
          }
        />
        <Route
          path="/recepsionist/checkin"
          element={
            <Protected>
              <ScanCheckInRecept />
            </Protected>
          }
        />
        <Route
          path="/recepsionist/claim-reward"
          element={
            <Protected>
              <ClaimReward />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
