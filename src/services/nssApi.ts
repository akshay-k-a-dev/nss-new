import { apiClient } from '../utils/apiClient';
import { apiRoutes } from './apiRoutes';
import type {
  Coordinator,
  Department,
  Program,
  RegisteredStudent,
  StudentReport,
} from '../types';

const { programs, students, coordinators, departments, studentReports, officers, homepageImages } =
  apiRoutes;

export interface OfficerPayload {
  id: string;
  name?: string;
  password?: string;
}

export interface HomepageImage {
  id: string;
  url: string;
  title?: string;
  description?: string;
  createdAt?: string;
}

export interface AuthCredentials {
  id: string;
  password: string;
}

export interface StudentPasswordPayload {
  id: string;
  password: string;
}

export interface StudentPasswordChangePayload {
  id: string;
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse<T = unknown> {
  token?: string;
  user?: T;
  message?: string;
  [key: string]: unknown;
}

export const nssApi = {
  // Programs
  getPrograms: () => apiClient.get<Program[]>(programs.base),
  createProgram: (program: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiClient.post<Program>(programs.base, program),
  updateProgram: (id: string, program: Partial<Program>) =>
    apiClient.put<Program>(programs.byId(id), program),
  deleteProgram: (id: string) => apiClient.delete<void>(programs.byId(id)),
  updateProgramParticipants: (id: string, participantIds: string[]) =>
    apiClient.put<Program>(programs.byId(id), { participantIds }),

  // Students
  getStudents: () => apiClient.get<RegisteredStudent[]>(students.base),
  createStudent: (student: Omit<RegisteredStudent, 'createdAt'>) =>
    apiClient.post<RegisteredStudent>(students.base, student),
  updateStudent: (id: string, updates: Partial<RegisteredStudent>) =>
    apiClient.put<RegisteredStudent>(students.byId(id), updates),
  deleteStudent: (id: string) => apiClient.delete<void>(students.byId(id)),
  studentLogin: (credentials: AuthCredentials) =>
    apiClient.post<AuthResponse<RegisteredStudent>>(students.login, credentials),
  studentSetPassword: (payload: StudentPasswordPayload) =>
    apiClient.post<AuthResponse>(students.setPassword, payload),
  studentChangePassword: (payload: StudentPasswordChangePayload) =>
    apiClient.post<AuthResponse>(students.changePassword, payload),

  // Coordinators
  getCoordinators: () => apiClient.get<Coordinator[]>(coordinators.base),
  createCoordinator: (coordinator: Omit<Coordinator, 'id' | 'createdAt'>) =>
    apiClient.post<Coordinator>(coordinators.base, coordinator),
  updateCoordinator: (id: string, updates: Partial<Coordinator>) =>
    apiClient.put<Coordinator>(coordinators.byId(id), updates),
  deleteCoordinator: (id: string) => apiClient.delete<void>(coordinators.byId(id)),

  // Departments
  getDepartments: () => apiClient.get<Department[]>(departments.base),
  createDepartment: (department: Pick<Department, 'name'>) =>
    apiClient.post<Department>(departments.base, department),
  updateDepartment: (id: string, updates: Partial<Department>) =>
    apiClient.put<Department>(departments.byId(id), updates),
  deleteDepartment: (id: string) => apiClient.delete<void>(departments.byId(id)),

  // Student Reports
  getStudentReports: () => apiClient.get<StudentReport[]>(studentReports.base),
  createStudentReport: (
    report: StudentReport & { studentId: string }
  ) => apiClient.post<StudentReport>(studentReports.base, report),
  updateStudentReport: (
    id: string,
    updates: Partial<StudentReport>
  ) => apiClient.put<StudentReport>(studentReports.byId(id), updates),

  // Officers
  updateOfficer: (id: string, payload: OfficerPayload) =>
    apiClient.put(officers.byId(id), payload),
  officerLogin: (credentials: AuthCredentials) =>
    apiClient.post<AuthResponse>(officers.login, credentials),

  // Homepage images (for completeness)
  getHomepageImages: () => apiClient.get<HomepageImage[]>(homepageImages.base),
  addHomepageImage: (image: Omit<HomepageImage, 'id'>) =>
    apiClient.post<HomepageImage>(homepageImages.base, image),
  updateHomepageImage: (id: string, updates: Partial<HomepageImage>) =>
    apiClient.put<HomepageImage>(homepageImages.byId(id), updates),
  deleteHomepageImage: (id: string) => apiClient.delete<void>(homepageImages.byId(id)),
};

