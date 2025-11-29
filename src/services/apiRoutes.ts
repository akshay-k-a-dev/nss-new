type Identifier = string | number;

const withId = (base: string) => (id: Identifier) => `${base}/${id}`;

export const apiRoutes = {
  programs: {
    base: '/programs',
    byId: withId('/programs'),
  },
  students: {
    base: '/students',
    byId: withId('/students'),
    login: '/students/login',
    setPassword: '/students/set-password',
    changePassword: '/students/change-password',
  },
  coordinators: {
    base: '/coordinators',
    byId: withId('/coordinators'),
  },
  departments: {
    base: '/departments',
    byId: withId('/departments'),
  },
  studentReports: {
    base: '/student-reports',
    byId: withId('/student-reports'),
  },
  officers: {
    base: '/officers',
    byId: withId('/officers'),
    login: '/officers/login',
  },
  homepageImages: {
    base: '/homepage-images',
    byId: withId('/homepage-images'),
  },
} as const;

export type ApiRoutes = typeof apiRoutes;

