import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layout
import Layout from "./components/Layout";

// Core Components
import Login from "./components/auth/Login";
import Dashboard from "./components/Dashboard";
import ProfilePage from "./components/ProfilePage";

// Personnel Module
import Employees from "./components/Employees";
import AddEmployee from "./components/AddEmployee";
import EditEmployee from "./components/EditEmployee";
import Team from "./pages/Team";
import AddTeam from "./pages/AddTeam";
import EditTeam from "./pages/EditTeam";

// Operations Module
import Project from "./pages/Project";
import AddProject from "./pages/AddProject";
import EditProject from "./pages/EditProject";
import Tickets from "./pages/Tasks";
import AddTask from "./pages/AddTask";
import EditTask from "./pages/EditTask";
import MyTickets from "./pages/MyTasks";

// Presence & Finance
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Calendar from "./pages/Calendar";
import Messenger from "./pages/Messenger";

// Compliance & Admin
import EmployeeDocuments from "./pages/EmployeeDocuments";
import AdminDocumentsVerify from "./components/AdminDocumentsVerify";
import MissingDocumentsEmployees from "./components/MissingDocumentsEmployees";

function App() {
  useEffect(() => {
    // Analytics or Global Initialization logic here
  }, []);

  return (
    <Router>
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        hideProgressBar={false} 
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />

        {/* Private Workspace Routes */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<ProfilePage />} />

          {/* Personnel Management */}
          <Route path="/employees" element={<Employees />} />
          <Route path="/add-employee" element={<AddEmployee />} />
          <Route path="/edit-employee/:id" element={<EditEmployee />} />
          <Route path="/team" element={<Team />} />
          <Route path="/add-team" element={<AddTeam />} />
          <Route path="/edit-team/:id" element={<EditTeam />} />

          {/* Operational Workflow */}
          <Route path="/projects" element={<Project />} />
          <Route path="/add-project" element={<AddProject />} />
          <Route path="/edit-project/:id" element={<EditProject />} />
          <Route path="/tasks" element={<Tickets />} />
          <Route path="/add-task" element={<AddTask />} />
          <Route path="/edit-task/:id" element={<EditTask />} />
          <Route path="/my-tasks" element={<MyTickets />} />

          {/* Presence & Finance */}
          <Route path="/attendance" element={<Attendance />} />
          <Route path="/leave" element={<Leave />} />
          <Route path="/payroll" element={<Payroll />} />

          <Route path="/calendar" element={<Calendar />} />
          <Route path="/messenger" element={<Messenger />} />

          {/* Compliance & Verification */}
          <Route path="/employees/:employeeId/onboarding-documents" element={<EmployeeDocuments />} />
          <Route path="/admin/onboarding-documents" element={<AdminDocumentsVerify />} />
          <Route path="/admin/missing-documents" element={<MissingDocumentsEmployees />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
