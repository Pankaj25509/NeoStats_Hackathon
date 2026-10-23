import { Navigate,Route,Routes } from 'react-router-dom';
import { AuthProvider,useAuth } from './auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectShell from './pages/ProjectShell';
import ProjectTasks from './pages/ProjectTasks';
import ProjectTeam from './pages/ProjectTeam';
import TaskDetail from './pages/TaskDetail';
import UsersPage from './pages/Users';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { Loading } from './components/ui';
function Guard({children}){const {user,loading}=useAuth();if(loading)return <Loading/>;return user?children:<Navigate to="/login" replace/>;}
function AdminGuard({children}){const {user}=useAuth();return user?.role==='Admin'?children:<Navigate to="/dashboard" replace/>;}
function RoutesView(){return <Routes><Route path="/login" element={<Login/>}/><Route path="/" element={<Guard><Layout/></Guard>}><Route index element={<Navigate to="/dashboard" replace/>}/><Route path="dashboard" element={<Dashboard/>}/><Route path="projects" element={<Projects/>}/><Route path="projects/:id" element={<ProjectShell/>}><Route index element={<ProjectOverviewRedirect/>}/><Route path="tasks" element={<ProjectTasks/>}/><Route path="team" element={<ProjectTeam/>}/></Route><Route path="tasks/:id" element={<TaskDetail/>}/><Route path="users" element={<AdminGuard><UsersPage/></AdminGuard>}/><Route path="profile" element={<Profile/>}/></Route><Route path="*" element={<NotFound/>}/></Routes>}
function ProjectOverviewRedirect(){return <Navigate to="tasks" replace/>;}
export default function App(){return <AuthProvider><RoutesView/></AuthProvider>;}
