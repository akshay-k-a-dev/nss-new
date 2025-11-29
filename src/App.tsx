import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { TeacherPortal } from './components/TeacherPortal';
//import { StudentPortal } from './components/StudentPortal';
import StudentPortal from "./components/StudentPortal";
import { ProgramOfficerPortal } from './components/ProgramOfficerPortal';
import { LoginPage } from './components/LoginPage';
import { ProgramsPage } from './components/ProgramsPage';
import { StoryBatch, StoryMediaItem } from './types';
import { Program, RegisteredStudent, Coordinator, StudentReport, Department } from './types';
import { nssApi } from './services/nssApi';
import { saveAuthSession, getAuthSession, clearAuthSession } from './utils/authStorage';

function App() {
  const [currentView, setCurrentView] = useState<'home' | 'programs' | 'stories' | 'login' | 'student' | 'coordinator' | 'officer'>('home');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [registeredStudents, setRegisteredStudents] = useState<RegisteredStudent[]>([]);
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    type: 'student' | 'coordinator' | 'officer';
    data: RegisteredStudent | Coordinator | { id: string; name: string };
  } | null>(null);

  // Reports keyed by studentId
  const [studentReports, setStudentReports] = useState<Record<string, StudentReport>>({});

  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  // STORIES state: batches -> albums -> media
  const [storyBatches, setStoryBatches] = useState<StoryBatch[]>([{
    id: 'batch-2024',
    name: '2024-25 Batch',
    createdAt: new Date().toISOString(),
    featuredMediaIds: [],
    albums: [
      {
        id: 'album-1',
        name: 'Orientation Program',
        createdAt: new Date().toISOString(),
        media: []
      }
    ]
  }]);
  const [currentBatchId, setCurrentBatchId] = useState<string>('batch-2024');

  // Department management
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'dept-1', name: 'Mathematics', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-2', name: 'Physics', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-3', name: 'Chemistry', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-4', name: 'Microbiology', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-5', name: 'History', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-6', name: 'English', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-7', name: 'ASM', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-8', name: 'BBA', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-9', name: 'BCOM', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-10', name: 'Computer Science', isActive: true, createdAt: new Date().toISOString() },
    { id: 'dept-11', name: 'Economics', isActive: true, createdAt: new Date().toISOString() },
  ]);

  // Program Officer credentials - loaded from backend
  const [officerCredentials, setOfficerCredentials] = useState<{ id: string; password: string } | null>(null);

  // Auto-logout functionality
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  const normalizeProgram = (program: Program): Program => ({
    ...program,
    coordinatorIds: program.coordinatorIds || [],
    participantIds: program.participantIds || [],
  });

  const getCoordinatedProgramPayload = (program: Program) => ({
    id: program.id,
    title: program.title,
    description: program.description,
    date: program.date,
    time: program.time,
    venue: program.venue,
    createdAt: program.createdAt,
  });

  const addProgramToCoordinatorReports = (program: Program, coordinatorIds: string[]) => {
    if (!coordinatorIds.length) return;

    setStudentReports(prev => {
      const updated = { ...prev };
      const coordinatedProgram = getCoordinatedProgramPayload(program);

      coordinatorIds.forEach(studentId => {
        const existingReport = updated[studentId] || { activities: [], coordinatedPrograms: [] };
        updated[studentId] = {
          ...existingReport,
          coordinatedPrograms: [
            coordinatedProgram,
            ...(existingReport.coordinatedPrograms || []).filter(p => p.id !== program.id),
          ],
        };
      });

      return updated;
    });
  };

  const removeProgramFromCoordinatorReports = (programId: string, coordinatorIds: string[]) => {
    if (!coordinatorIds.length) return;

    setStudentReports(prev => {
      const updated = { ...prev };
      coordinatorIds.forEach(studentId => {
        if (!updated[studentId]) return;
        updated[studentId] = {
          ...updated[studentId],
          coordinatedPrograms: (updated[studentId].coordinatedPrograms || []).filter(
            program => program.id !== programId
          ),
        };
      });
      return updated;
    });
  };

  // Auto-logout function
  const handleAutoLogout = useCallback(() => {
    alert('You have been automatically logged out due to inactivity (30 minutes).');
    handleLogout();
  }, []);

  // Reset logout timer on user activity
  const resetLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
    }
    
    if (isLoggedIn) {
      logoutTimerRef.current = setTimeout(() => {
        handleAutoLogout();
      }, INACTIVITY_TIMEOUT);
    }
  }, [isLoggedIn, INACTIVITY_TIMEOUT, handleAutoLogout]);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      resetLogoutTimer();
      
      // Add event listeners for user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
      
      const handleUserActivity = () => {
        resetLogoutTimer();
      };
      
      events.forEach(event => {
        document.addEventListener(event, handleUserActivity, true);
      });
      
      // Cleanup function
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, handleUserActivity, true);
        });
        if (logoutTimerRef.current) {
          clearTimeout(logoutTimerRef.current);
        }
      };
    } else {
      // Clear timer when not logged in
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
    }
  }, [isLoggedIn, resetLogoutTimer]);

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    const bootstrap = async () => {
      try {
        // Restore auth session from IndexedDB
        const savedSession = await getAuthSession();
        if (savedSession && isActive) {
          setCurrentUser({
            type: savedSession.userType,
            data: savedSession.userData as RegisteredStudent | Coordinator | { id: string; name: string },
          });
          setIsLoggedIn(true);
          setCurrentView(savedSession.userType);
        }

        const [programData, studentData, coordinatorData, departmentData] = await Promise.all([
          nssApi.getPrograms().catch(error => {
            console.warn('Failed to load programs from API', error);
            return null;
          }),
          nssApi.getStudents().catch(error => {
            console.warn('Failed to load students from API', error);
            return null;
          }),
          nssApi.getCoordinators().catch(error => {
            console.warn('Failed to load coordinators from API', error);
            return null;
          }),
          nssApi.getDepartments().catch(error => {
            console.warn('Failed to load departments from API', error);
            return null;
          }),
        ]);

        if (!isActive) {
          return;
        }

        if (programData) {
          setPrograms(programData.map(normalizeProgram));
        }

        if (studentData) {
          setRegisteredStudents(studentData);
        }

        if (coordinatorData) {
          setCoordinators(coordinatorData);
        }

        if (departmentData) {
          setDepartments(departmentData);
        }

        setBootstrapError(null);
      } catch (error) {
        if (!isActive) return;
        const message =
          error instanceof Error ? error.message : 'Failed to contact NSS backend.';
        setBootstrapError(message);
      } finally {
        if (isActive) {
          setIsBootstrapping(false);
        }
      }
    };

    bootstrap();

    return () => {
      isActive = false;
    };
  }, []);

  const handleLogin = async (credentials: { id: string; password: string }): Promise<void> => {
    // Officer first (single set of credentials) - use API if credentials not loaded
    if (officerCredentials && credentials.id === officerCredentials.id && credentials.password === officerCredentials.password) {
      const userData = { id: credentials.id, name: 'Program Officer' };
      setCurrentUser({ type: 'officer', data: userData });
      setIsLoggedIn(true);
      setCurrentView('officer');
      await saveAuthSession('officer', userData);
      return;
    }
    
    // Try officer login via API if credentials not available locally
    if (!officerCredentials) {
      try {
        const response = await nssApi.officerLogin(credentials);
        if (response.user || response.token) {
          const userData = { id: credentials.id, name: 'Program Officer' };
          setCurrentUser({ type: 'officer', data: userData });
          setIsLoggedIn(true);
          setCurrentView('officer');
          await saveAuthSession('officer', userData);
          return;
        }
      } catch {
        // Continue to coordinator/student login
      }
    }

    // Coordinator next (must be active)
    const coordinator = coordinators.find(c => c.id === credentials.id && c.password === credentials.password && c.isActive);
    if (coordinator) {
      setCurrentUser({ type: 'coordinator', data: coordinator });
      setIsLoggedIn(true);
      setCurrentView('coordinator');
      await saveAuthSession('coordinator', coordinator);
      return;
    }

    // Student last
    const student = registeredStudents.find(s => s.id === credentials.id && s.password === credentials.password);
    if (student) {
      setCurrentUser({ type: 'student', data: student });
      setIsLoggedIn(true);
      setCurrentView('student');
      await saveAuthSession('student', student);
      return;
    }

    throw new Error('Invalid credentials');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentView('home');
    
    // Clear auth session from IndexedDB
    void clearAuthSession();
    
    // Clear the logout timer
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const handleAddProgram = (programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    const fallbackProgram: Program = {
      ...programData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participantIds: [],
    };

    const persistProgram = (program: Program) => {
      const normalizedProgram = normalizeProgram({
        ...program,
        updatedAt: program.updatedAt || new Date().toISOString(),
      });
      setPrograms(prev => [normalizedProgram, ...prev]);
      addProgramToCoordinatorReports(normalizedProgram, normalizedProgram.coordinatorIds || []);
    };

    void nssApi
      .createProgram(programData)
      .then(createdProgram => {
        persistProgram(createdProgram);
      })
      .catch(error => {
        console.error('Failed to create program via API, using local fallback', error);
        persistProgram(fallbackProgram);
      });
  };

  const handleEditProgram = async (id: string, programData: Omit<Program, 'id' | 'createdAt' | 'updatedAt'>) => {
    // Get the old program to compare coordinators
    const oldProgram = programs.find(p => p.id === id);
    
    try {
      // Update program via API (syncs with Prisma)
      await nssApi.updateProgram(id, programData);
    } catch (error) {
      console.error('Failed to update program via API:', error);
    }
    
    // Update local state
    setPrograms(prev => prev.map(program => 
      program.id === id 
        ? { ...program, ...programData, updatedAt: new Date().toISOString() }
        : program
    ));
    
    // Update student reports if coordinators changed
    if (oldProgram && programData.coordinatorIds) {
      // Remove program from old coordinators' reports
      if (oldProgram.coordinatorIds) {
        setStudentReports(prev => {
          const updated = { ...prev };
                     oldProgram.coordinatorIds.forEach(studentId => {
             if (updated[studentId]) {
               updated[studentId] = {
                 ...updated[studentId],
                 coordinatedPrograms: (updated[studentId].coordinatedPrograms || []).filter(p => p.id !== id)
               };
             }
           });
          return updated;
        });
      }
      
      // Add program to new coordinators' reports
      if (programData.coordinatorIds.length > 0) {
        setStudentReports(prev => {
          const updated = { ...prev };
          const coordinatedProgram = {
            id: id,
            title: programData.title,
            description: programData.description,
            date: programData.date,
            time: programData.time,
            venue: programData.venue,
            createdAt: oldProgram.createdAt,
          };
          
          programData.coordinatorIds.forEach(studentId => {
            const existingReport = updated[studentId];
            if (existingReport) {
              updated[studentId] = {
                ...existingReport,
                coordinatedPrograms: [coordinatedProgram, ...existingReport.coordinatedPrograms.filter(p => p.id !== id)]
              };
            } else {
              updated[studentId] = {
                activities: [],
                coordinatedPrograms: [coordinatedProgram]
              };
            }
          });
          return updated;
        });
      }
    }
  };

  const handleDeleteProgram = async (id: string) => {
    // Get the program to remove from coordinator reports
    const program = programs.find(p => p.id === id);
    
    try {
      // Delete program via API (syncs with Prisma)
      await nssApi.deleteProgram(id);
    } catch (error) {
      console.error('Failed to delete program via API:', error);
    }
    
    // Update local state regardless
    setPrograms(prev => prev.filter(p => p.id !== id));
    
    // Remove from coordinator reports
    if (program?.coordinatorIds) {
      removeProgramFromCoordinatorReports(id, program.coordinatorIds);
    }
  };

  const handleAddParticipants = async (programId: string, studentIds: string[]) => {
    try {
      // Update program participants via API (syncs with Prisma)
      await nssApi.updateProgramParticipants(programId, studentIds);
    } catch (error) {
      console.error('Failed to update program participants via API:', error);
    }
    
    // Update local state
    setPrograms(prev => prev.map(program => 
      program.id === programId 
        ? { ...program, participantIds: studentIds, updatedAt: new Date().toISOString() }
        : program
    ));
  };

  const handleAddStudent = async (studentData: Omit<RegisteredStudent, 'createdAt'>) => {
    try {
      // Create student via API (syncs with Prisma)
      const createdStudent = await nssApi.createStudent(studentData);
      setRegisteredStudents(prev => [...prev, createdStudent]);
      
      // Show the student their login ID
      alert(`Student created successfully!\n\nLogin ID: ${createdStudent.id}\nPassword: ${studentData.password}\n\nPlease save these credentials.`);
    } catch (error) {
      console.error('Failed to create student via API:', error);
      // Fallback to local creation
      const newStudent: RegisteredStudent = {
        ...studentData,
        createdAt: new Date().toISOString(),
      };
      setRegisteredStudents(prev => [...prev, newStudent]);
      alert(`Student created locally.\n\nLogin ID: ${newStudent.id}\nPassword: ${studentData.password}`);
    }
  };

  const handleAddCoordinator = async (coordinatorData: Omit<Coordinator, 'id' | 'createdAt'>) => {
    try {
      // Create coordinator via API (syncs with Prisma)
      const createdCoordinator = await nssApi.createCoordinator(coordinatorData);
      setCoordinators(prev => [...prev, createdCoordinator]);
      
      // Show the coordinator their login ID
      alert(`Coordinator created successfully!\n\nLogin ID: ${createdCoordinator.id}\nPassword: ${coordinatorData.password}\n\nPlease save these credentials.`);
    } catch (error) {
      console.error('Failed to create coordinator via API:', error);
      // Fallback to local creation with generated ID
      const newCoordinator: Coordinator = {
        ...coordinatorData,
        id: 'COORD' + (Math.floor(Math.random() * 9000) + 1000).toString(),
        createdAt: new Date().toISOString(),
      };
      setCoordinators(prev => [...prev, newCoordinator]);
      alert(`Coordinator created locally.\n\nLogin ID: ${newCoordinator.id}\nPassword: ${coordinatorData.password}`);
    }
  };

  const handleToggleCoordinatorAccess = async (id: string) => {
    const coordinator = coordinators.find(c => c.id === id);
    if (!coordinator) return;
    
    const newIsActive = !coordinator.isActive;
    
    try {
      // Update coordinator via API (syncs with Prisma)
      await nssApi.updateCoordinator(id, { isActive: newIsActive });
    } catch (error) {
      console.error('Failed to toggle coordinator access via API:', error);
    }
    
    // Update local state regardless
    setCoordinators(prev => prev.map(c =>
      c.id === id ? { ...c, isActive: newIsActive } : c
    ));
  };

  const handleEditStudent = async (id: string, updates: { name: string; department: string; password: string; profileImageUrl?: string }) => {
    try {
      // Update student via API (syncs with Prisma)
      await nssApi.updateStudent(id, updates);
    } catch (error) {
      console.error('Failed to update student via API:', error);
    }
    
    // Update local state regardless
    setRegisteredStudents(prev => prev.map(student =>
      student.id === id ? { ...student, ...updates } : student
    ));
  };

  const handleEditCoordinator = async (id: string, updates: { name: string; department: string; password: string }) => {
    try {
      // Update coordinator via API (syncs with Prisma)
      await nssApi.updateCoordinator(id, updates);
    } catch (error) {
      console.error('Failed to update coordinator via API:', error);
    }
    
    // Update local state regardless
    setCoordinators(prev => prev.map(coordinator =>
      coordinator.id === id ? { ...coordinator, ...updates } : coordinator
    ));
  };

  const handleDeleteStudent = async (id: string) => {
    try {
      // Delete student via API (syncs with Prisma)
      await nssApi.deleteStudent(id);
    } catch (error) {
      console.error('Failed to delete student via API:', error);
    }
    
    // Update local state regardless
    setRegisteredStudents(prev => prev.filter(student => student.id !== id));
    // Also remove from all program participants
    setPrograms(prev => prev.map(program => ({
      ...program,
      participantIds: program.participantIds?.filter(participantId => participantId !== id) || []
    })));
    // Remove report data for this student
    setStudentReports(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const handleDeleteCoordinator = async (id: string) => {
    try {
      // Delete coordinator via API (syncs with Prisma)
      await nssApi.deleteCoordinator(id);
    } catch (error) {
      console.error('Failed to delete coordinator via API:', error);
    }
    
    // Update local state regardless
    setCoordinators(prev => prev.filter(coordinator => coordinator.id !== id));
  };

  const handleUpdateOfficerPassword = async (newPassword: string) => {
    try {
      // Update officer password via API (syncs with Prisma)
      await nssApi.updateOfficer('officer', { id: 'officer', password: newPassword });
    } catch (error) {
      console.error('Failed to update officer password via API:', error);
    }
    
    // Update local state
    if (officerCredentials) {
      setOfficerCredentials(prev => prev ? { ...prev, password: newPassword } : null);
    }
  };

  // Department management functions
  const handleAddDepartment = async (name: string) => {
    try {
      // Create department via API (syncs with Prisma)
      const createdDepartment = await nssApi.createDepartment({ name });
      setDepartments(prev => [...prev, createdDepartment]);
    } catch (error) {
      console.error('Failed to create department via API:', error);
      // Fallback to local creation
      const newDepartment: Department = {
        id: 'dept-' + Date.now(),
        name,
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      setDepartments(prev => [...prev, newDepartment]);
    }
  };

  const handleEditDepartment = async (id: string, newName: string) => {
    const oldDepartment = departments.find(d => d.id === id);
    if (!oldDepartment) return;

    try {
      // Update department via API (syncs with Prisma)
      await nssApi.updateDepartment(id, { name: newName });
    } catch (error) {
      console.error('Failed to update department via API:', error);
    }

    // Update department name locally
    setDepartments(prev => prev.map(d => 
      d.id === id ? { ...d, name: newName } : d
    ));

    // Propagate department name change to all students
    setRegisteredStudents(prev => prev.map(student => 
      student.department === oldDepartment.name 
        ? { ...student, department: newName }
        : student
    ));
  };

  const handleToggleDepartment = async (id: string) => {
    const department = departments.find(d => d.id === id);
    if (!department) return;
    
    const newIsActive = !department.isActive;
    
    try {
      // Update department via API (syncs with Prisma)
      await nssApi.updateDepartment(id, { isActive: newIsActive });
    } catch (error) {
      console.error('Failed to toggle department via API:', error);
    }
    
    // Update local state
    setDepartments(prev => prev.map(d => 
      d.id === id ? { ...d, isActive: newIsActive } : d
    ));
  };
  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage programs={programs} />;
      case 'programs':
        return <ProgramsPage programs={programs} />;
      case 'stories':
        if (isLoggedIn) {
          const StoriesPage = React.lazy(() => import('./components/StoriesPage'));
          return (
            <React.Suspense fallback={<div className="p-6">Loading...</div>}>
              <StoriesPage
                batches={storyBatches}
                currentBatchId={currentBatchId}
                setCurrentBatchId={setCurrentBatchId}
                canManage={currentUser?.type === 'coordinator' || currentUser?.type === 'officer'}
                isOfficer={currentUser?.type === 'officer'}
                onCreateBatch={(name: string) => {
                  const newBatch: StoryBatch = { id: 'batch-' + Date.now(), name, albums: [], featuredMediaIds: [], createdAt: new Date().toISOString() };
                  setStoryBatches(prev => [newBatch, ...prev]);
                  setCurrentBatchId(newBatch.id);
                }}
                onCreateAlbum={(batchId: string, name: string) => {
                  setStoryBatches(prev => prev.map(b => b.id === batchId ? { ...b, albums: [{ id: 'album-' + Date.now(), name, media: [], createdAt: new Date().toISOString() }, ...b.albums] } : b));
                }}
                onDeleteMedia={(batchId: string, albumId: string, mediaId: string) => {
                  setStoryBatches(prev => prev.map(b => b.id === batchId ? { ...b, albums: b.albums.map(a => a.id === albumId ? { ...a, media: a.media.filter(m => m.id !== mediaId) } : a), featuredMediaIds: b.featuredMediaIds.filter(id => id !== mediaId) } : b));
                }}
                onAddMedia={(batchId: string, albumId: string, files: File[]) => {
                  const newItems: StoryMediaItem[] = files.map((f: File) => ({ id: 'media-' + Date.now() + '-' + Math.random().toString(36).slice(2,8), type: f.type.startsWith('video') ? 'video' : 'image', url: URL.createObjectURL(f), title: f.name, createdAt: new Date().toISOString() }));
                  setStoryBatches(prev => prev.map(b => b.id === batchId ? { ...b, albums: b.albums.map(a => a.id === albumId ? { ...a, media: [...newItems, ...a.media] } : a) } : b));
                }}
                onToggleFeatured={(batchId: string, mediaId: string) => {
                  setStoryBatches(prev => prev.map(b => b.id === batchId ? { ...b, featuredMediaIds: b.featuredMediaIds.includes(mediaId) ? b.featuredMediaIds.filter(id => id !== mediaId) : [...b.featuredMediaIds, mediaId] } : b));
                }}
                onMergeCurrentAlbumToSingle={() => {
                  // No-op placeholder; UI will just present action confirmation
                }}
              />
            </React.Suspense>
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'login':
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'student':
        if (isLoggedIn && currentUser?.type === 'student') {
          return (
            <StudentPortal 
              programs={programs} 
              currentStudent={currentUser.data as RegisteredStudent}
            />
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'coordinator':
        if (isLoggedIn && (currentUser?.type === 'coordinator' || currentUser?.type === 'officer')) {
          return (
            <TeacherPortal
              programs={programs}
              registeredStudents={registeredStudents}
              onAddProgram={handleAddProgram}
              onEditProgram={handleEditProgram}
              onDeleteProgram={handleDeleteProgram}
              onAddParticipants={handleAddParticipants}
            />
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      case 'officer':
        if (isLoggedIn && currentUser?.type === 'officer') {
          return (
            <ProgramOfficerPortal
              students={registeredStudents}
              coordinators={coordinators}
              departments={departments}
              onAddStudent={handleAddStudent}
              onAddCoordinator={handleAddCoordinator}
              onToggleCoordinatorAccess={handleToggleCoordinatorAccess}
              onDeleteStudent={handleDeleteStudent}
              onDeleteCoordinator={handleDeleteCoordinator}
              onUpdateOfficerPassword={handleUpdateOfficerPassword}
              onEditStudent={handleEditStudent}
              onEditCoordinator={handleEditCoordinator}
              onAddDepartment={handleAddDepartment}
              onEditDepartment={handleEditDepartment}
              onToggleDepartment={handleToggleDepartment}
              studentReports={studentReports}
              programs={programs}
              onAddStudentActivity={(studentId, activity) => {
                setStudentReports(prev => {
                  const report = prev[studentId] || { activities: [], coordinatedPrograms: [] };
                  return {
                    ...prev,
                    [studentId]: {
                      activities: [
                        ...report.activities,
                        { ...activity, id: Date.now().toString(), createdAt: new Date().toISOString() },
                      ],
                      coordinatedPrograms: report.coordinatedPrograms || [],
                    },
                  };
                });
              }}
              onEditStudentActivity={(studentId, activityId, updates) => {
                setStudentReports(prev => {
                  const report = prev[studentId];
                  if (!report) return prev;
                  return {
                    ...prev,
                    [studentId]: {
                      activities: report.activities.map(a => a.id === activityId ? { ...a, ...updates } : a),
                      coordinatedPrograms: report.coordinatedPrograms || [],
                    },
                  };
                });
              }}
            />
          );
        }
        return <LoginPage onLogin={handleLogin} onBack={() => setCurrentView('home')} />;
      default:
        return <HomePage programs={programs} />;
    }
  };

  const getUserInfo = () => {
    if (!currentUser) return undefined;
    return {
      name: currentUser.type === 'officer' 
        ? (currentUser.data as { name: string }).name
        : (currentUser.data as RegisteredStudent | Coordinator).name,
      type: currentUser.type
    };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        currentView={currentView} 
        onViewChange={setCurrentView}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userInfo={getUserInfo()}
      />
      {renderCurrentView()}
    </div>
  );
}

export default App;