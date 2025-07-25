import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';
import { 
  User, Role, Permission, Survey, Section, Question, TestSession, TestResult, 
  Certificate, Dashboard, SystemSettings, ApiResponse, FileUploadResult, Activity
} from '../types';

// Helper function to generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Auth Service
export const AuthService = {
  async login(email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      console.log('AuthService: Attempting login for:', email);
      
      if (!supabase) {
        console.log('AuthService: Supabase not configured, using demo mode');
        // Demo mode fallback
        const demoUsers = [
          { email: 'admin@esigma.com', password: 'password123', role: 'Admin', level: 1 },
          { email: 'zo@esigma.com', password: 'password123', role: 'ZO User', level: 2 },
          { email: 'ro@esigma.com', password: 'password123', role: 'RO User', level: 3 },
          { email: 'supervisor@esigma.com', password: 'password123', role: 'Supervisor', level: 4 },
          { email: 'enumerator@esigma.com', password: 'password123', role: 'Enumerator', level: 5 }
        ];
        
        const demoUser = demoUsers.find(u => u.email === email && u.password === password);
        if (demoUser) {
          const user: User = {
            id: generateUUID(),
            email: demoUser.email,
            name: demoUser.role + ' User',
            roleId: generateUUID(),
            role: {
              id: generateUUID(),
              name: demoUser.role,
              description: `${demoUser.role} role`,
              level: demoUser.level,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            isActive: true,
            jurisdiction: 'Demo Jurisdiction',
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          return {
            success: true,
            data: { user, token: 'demo-token-' + Date.now() },
            message: 'Demo login successful'
          };
        }
        
        return { success: false, message: 'Invalid credentials' };
      }

      // Get user with role information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        console.log('AuthService: User not found or error:', userError);
        return { success: false, message: 'Invalid email or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash);
      if (!isValidPassword) {
        console.log('AuthService: Invalid password for user:', email);
        return { success: false, message: 'Invalid email or password' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      const user: User = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        roleId: userData.role_id,
        role: {
          id: userData.role.id,
          name: userData.role.name,
          description: userData.role.description,
          level: userData.role.level,
          isActive: userData.role.is_active,
          menuAccess: userData.role.menu_access,
          createdAt: new Date(userData.role.created_at),
          updatedAt: new Date(userData.role.updated_at)
        },
        isActive: userData.is_active,
        jurisdiction: userData.jurisdiction,
        zone: userData.zone,
        region: userData.region,
        district: userData.district,
        employeeId: userData.employee_id,
        phoneNumber: userData.phone_number,
        createdAt: new Date(userData.created_at),
        updatedAt: new Date(userData.updated_at)
      };

      return {
        success: true,
        data: { user, token: 'jwt-token-' + Date.now() },
        message: 'Login successful'
      };
    } catch (error) {
      console.error('AuthService: Login error:', error);
      return { success: false, message: 'Login failed. Please try again.' };
    }
  },

  async logout(): Promise<ApiResponse<void>> {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      return { success: true, message: 'Logout successful' };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      return { success: false, message: 'Logout failed' };
    }
  }
};

// User Service
export const UserService = {
  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      console.log('UserService: Fetching users');
      
      if (!supabase) {
        console.log('UserService: Supabase not configured, returning demo data');
        // Return demo users when Supabase is not configured
        const demoUsers: User[] = [
          {
            id: '550e8400-e29b-41d4-a716-446655440010',
            email: 'admin@esigma.com',
            name: 'System Administrator',
            roleId: '550e8400-e29b-41d4-a716-446655440001',
            role: {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Administrator',
              description: 'System Administrator with full access',
              level: 1,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            isActive: true,
            jurisdiction: 'National',
            employeeId: 'ADM001',
            phoneNumber: '+91-9876543210',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440011',
            email: 'cpg@esigma.com',
            name: 'CPG Officer',
            roleId: '550e8400-e29b-41d4-a716-446655440002',
            role: { 
              id: '550e8400-e29b-41d4-a716-446655440002', 
              name: 'CPG User', 
              description: 'Central Planning Group User', 
              level: 2, 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            },
            isActive: true,
            jurisdiction: 'Central Planning Group',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440012',
            email: 'zo@esigma.com',
            name: 'Zonal Officer',
            roleId: '550e8400-e29b-41d4-a716-446655440003',
            role: { 
              id: '550e8400-e29b-41d4-a716-446655440003', 
              name: 'ZO User', 
              description: 'Zonal Office User', 
              level: 3, 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            },
            isActive: true,
            jurisdiction: 'North Zone',
            zone: 'North Zone',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440013',
            email: 'ro@esigma.com',
            name: 'Regional Officer',
            roleId: '550e8400-e29b-41d4-a716-446655440004',
            role: { 
              id: '550e8400-e29b-41d4-a716-446655440004', 
              name: 'RO User', 
              description: 'Regional Office User', 
              level: 4, 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            },
            isActive: true,
            jurisdiction: 'Delhi Region',
            zone: 'North Zone',
            region: 'Delhi Region',
            parentId: '550e8400-e29b-41d4-a716-446655440012',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440014',
            email: 'supervisor@esigma.com',
            name: 'Field Supervisor',
            roleId: '550e8400-e29b-41d4-a716-446655440005',
            role: { 
              id: '550e8400-e29b-41d4-a716-446655440005', 
              name: 'Supervisor', 
              description: 'Field Supervisor', 
              level: 5, 
              isActive: true, 
              createdAt: new Date(), 
              updatedAt: new Date() 
            },
            isActive: true,
            jurisdiction: 'Central Delhi District',
            zone: 'North Zone',
            region: 'Delhi Region',
            district: 'Central Delhi',
            parentId: '550e8400-e29b-41d4-a716-446655440013',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440015',
            email: 'enumerator@esigma.com',
            name: 'Field Enumerator',
            roleId: '550e8400-e29b-41d4-a716-446655440006',
            role: {
              id: '550e8400-e29b-41d4-a716-446655440006',
              name: 'Enumerator',
              description: 'Field Enumerator (Lowest Level)',
              level: 6,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            isActive: true,
            jurisdiction: 'Block A, Central Delhi',
            zone: 'North Zone',
            region: 'Delhi Region',
            district: 'Central Delhi',
            parentId: '550e8400-e29b-41d4-a716-446655440014',
            employeeId: 'ENU001',
            phoneNumber: '+91-9876543214',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        return {
          success: true,
          data: demoUsers,
          message: 'Demo users loaded (Supabase not configured)'
        };
      }

      console.log('UserService: Attempting to fetch users from Supabase');
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          role:roles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('UserService: Error fetching users:', error);
        
        // If there's a database error, provide helpful guidance
        let errorMessage = `Database error: ${error.message}`;
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = 'Database tables not found. Please initialize the database first.';
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          errorMessage = 'Permission denied. Please check your database policies or initialize the database.';
        }
        
        return { success: false, message: errorMessage, data: [] };
      }

      console.log('UserService: Raw data from Supabase:', data);
      
      if (!data || data.length === 0) {
        console.log('UserService: No users found in database');
        return {
          success: true,
          data: [],
          message: 'No users found. Please initialize the database or create users.'
        };
      }
      const users: User[] = data.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.role_id,
        role: {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          level: user.role.level,
          isActive: user.role.is_active,
          menuAccess: user.role.menu_access,
          createdAt: new Date(user.role.created_at),
          updatedAt: new Date(user.role.updated_at)
        },
        isActive: user.is_active,
        jurisdiction: user.jurisdiction,
        zone: user.zone,
        region: user.region,
        district: user.district,
        employeeId: user.employee_id,
        phoneNumber: user.phone_number,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at)
      }));

      console.log('UserService: Processed users:', users.length);
      
      return {
        success: true,
        data: users,
        message: `${users.length} users fetched successfully`
      };
    } catch (error) {
      console.error('UserService: Error in getUsers:', error);
      return { success: false, message: 'Failed to fetch users', data: [] };
    }
  },

  async createUser(userData: {
    name: string;
    email: string;
    roleId: string;
    jurisdiction?: string;
    zone?: string;
    region?: string;
    district?: string;
    employeeId?: string;
    phoneNumber?: string;
  }): Promise<ApiResponse<User>> {
    try {
      console.log('UserService: Creating user:', userData.email);
      
      if (!supabase) {
        console.log('UserService: Supabase not configured, creating demo user');
        // Create a demo user for testing
        const demoUser: User = {
          id: generateUUID(),
          email: userData.email,
          name: userData.name,
          roleId: userData.roleId,
          role: {
            id: userData.roleId,
            name: 'Demo Role',
            description: 'Demo role for testing',
            level: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          isActive: true,
          jurisdiction: userData.jurisdiction,
          zone: userData.zone,
          region: userData.region,
          district: userData.district,
          employeeId: userData.employeeId,
          phoneNumber: userData.phoneNumber,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return {
          success: true,
          data: demoUser,
          message: 'Demo user created successfully. Default password: password123'
        };
      }

      // Validate required fields
      if (!userData.name || !userData.email || !userData.roleId) {
        return { success: false, message: 'Name, email, and role are required' };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        return { success: false, message: 'Please enter a valid email address' };
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', userData.email)
        .maybeSingle();

      if (existingUser) {
        return { success: false, message: 'User with this email already exists' };
      }

      // Verify role exists
      const { data: role, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .eq('id', userData.roleId)
        .maybeSingle();

      if (roleError || !role) {
        console.error('UserService: Role not found:', userData.roleId, roleError);
        return { success: false, message: 'Invalid role selected' };
      }

      // Generate default password (should be changed on first login)
      const defaultPassword = 'password123';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      console.log('UserService: Inserting user into database with data:', {
        email: userData.email,
        name: userData.name,
        role_id: userData.roleId,
        jurisdiction: userData.jurisdiction,
        zone: userData.zone,
        region: userData.region,
        district: userData.district,
        employee_id: userData.employeeId,
        phone_number: userData.phoneNumber
      });

      // Create user in database
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: userData.email,
          password_hash: passwordHash,
          name: userData.name,
          role_id: userData.roleId,
          jurisdiction: userData.jurisdiction || null,
          zone: userData.zone || null,
          region: userData.region || null,
          district: userData.district || null,
          employee_id: userData.employeeId || null,
          phone_number: userData.phoneNumber || null,
          is_active: true,
          password_changed_at: new Date().toISOString(),
          failed_login_attempts: 0
        })
        .select(`
          *,
          role:roles(*)
        `)
        .single();

      if (createError) {
        console.error('UserService: Error creating user:', createError);
        
        // Provide more specific error messages
        if (createError.code === '23505') {
          if (createError.message.includes('email')) {
            return { success: false, message: 'A user with this email already exists' };
          }
          if (createError.message.includes('employee_id')) {
            return { success: false, message: 'A user with this employee ID already exists' };
          }
          return { success: false, message: 'A user with this information already exists' };
        }
        
        return { success: false, message: `Failed to create user: ${createError.message}` };
      }

      console.log('UserService: User created successfully:', newUser);

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        roleId: newUser.role_id,
        role: {
          id: newUser.role.id,
          name: newUser.role.name,
          description: newUser.role.description,
          level: newUser.role.level,
          isActive: newUser.role.is_active,
          menuAccess: newUser.role.menu_access,
          createdAt: new Date(newUser.role.created_at),
          updatedAt: new Date(newUser.role.updated_at)
        },
        isActive: newUser.is_active,
        jurisdiction: newUser.jurisdiction,
        zone: newUser.zone,
        region: newUser.region,
        district: newUser.district,
        employeeId: newUser.employee_id,
        phoneNumber: newUser.phone_number,
        createdAt: new Date(newUser.created_at),
        updatedAt: new Date(newUser.updated_at)
      };

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert({
            activity_type: 'user_created',
            description: `User ${newUser.name} (${newUser.email}) was created with role ${role.name}`,
            metadata: { 
              user_id: newUser.id,
              role_id: userData.roleId, 
              created_by: 'admin',
              employee_id: userData.employeeId 
            }
          });
      } catch (logError) {
        console.warn('UserService: Failed to log activity:', logError);
      }

      return {
        success: true,
        data: user,
        message: `User created successfully. Default password: ${defaultPassword}`
      };
    } catch (error) {
      console.error('UserService: Error in createUser:', error);
      return { success: false, message: `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  },

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('UserService: Deleting user:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Check if user exists and get their info for logging
      const { data: user } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', id)
        .single();

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      // Delete user
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('UserService: Error deleting user:', error);
        return { success: false, message: `Failed to delete user: ${error.message}` };
      }

      // Log activity
      try {
        await supabase
          .from('activity_logs')
          .insert({
            activity_type: 'user_deleted',
            description: `User ${user.name} (${user.email}) was deleted`,
            metadata: { deleted_user_id: id }
          });
      } catch (logError) {
        console.warn('UserService: Failed to log activity:', logError);
      }

      return {
        success: true,
        message: 'User deleted successfully'
      };
    } catch (error) {
      console.error('UserService: Error in deleteUser:', error);
      return { success: false, message: 'Failed to delete user' };
    }
  }
};

// Role Service
export const RoleService = {
  async getRoles(): Promise<ApiResponse<Role[]>> {
    try {
      console.log('RoleService: Fetching roles');
      
      if (!supabase) {
        console.log('RoleService: Supabase not configured, returning demo data');
        return {
          success: true,
          data: [
            {
              id: '550e8400-e29b-41d4-a716-446655440001',
              name: 'Admin',
              description: 'System Administrator',
              level: 1,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          message: 'Demo roles fetched'
        };
      }

      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('level', { ascending: true });

      if (error) {
        console.error('RoleService: Error fetching roles:', error);
        return { success: false, message: `Failed to fetch roles: ${error.message}`, data: [] };
      }

      const roles: Role[] = data.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        level: role.level,
        isActive: role.is_active,
        menuAccess: role.menu_access,
        createdAt: new Date(role.created_at),
        updatedAt: new Date(role.updated_at)
      }));

      return {
        success: true,
        data: roles,
        message: 'Roles fetched successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in getRoles:', error);
      return { success: false, message: 'Failed to fetch roles', data: [] };
    }
  },

  async createRole(roleData: { name: string; description: string; level?: number }): Promise<ApiResponse<Role>> {
    try {
      console.log('RoleService: Creating role:', roleData.name);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('roles')
        .insert({
          name: roleData.name,
          description: roleData.description,
          level: roleData.level || 5,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('RoleService: Error creating role:', error);
        return { success: false, message: `Failed to create role: ${error.message}` };
      }

      const role: Role = {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.is_active,
        menuAccess: data.menu_access,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return {
        success: true,
        data: role,
        message: 'Role created successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in createRole:', error);
      return { success: false, message: 'Failed to create role' };
    }
  },

  async updateRole(id: string, roleData: { name: string; description: string }): Promise<ApiResponse<Role>> {
    try {
      console.log('RoleService: Updating role:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('roles')
        .update({
          name: roleData.name,
          description: roleData.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('RoleService: Error updating role:', error);
        return { success: false, message: `Failed to update role: ${error.message}` };
      }

      const role: Role = {
        id: data.id,
        name: data.name,
        description: data.description,
        level: data.level,
        isActive: data.is_active,
        menuAccess: data.menu_access,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return {
        success: true,
        data: role,
        message: 'Role updated successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in updateRole:', error);
      return { success: false, message: 'Failed to update role' };
    }
  },

  async deleteRole(id: string): Promise<ApiResponse<void>> {
    try {
      console.log('RoleService: Deleting role:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('RoleService: Error deleting role:', error);
        return { success: false, message: `Failed to delete role: ${error.message}` };
      }

      return {
        success: true,
        message: 'Role deleted successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in deleteRole:', error);
      return { success: false, message: 'Failed to delete role' };
    }
  },

  async updateRoleMenuAccess(roleId: string, menuAccess: string[]): Promise<ApiResponse<void>> {
    try {
      console.log('RoleService: Updating menu access for role:', roleId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('roles')
        .update({
          menu_access: menuAccess,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId);

      if (error) {
        console.error('RoleService: Error updating menu access:', error);
        return { success: false, message: `Failed to update menu access: ${error.message}` };
      }

      return {
        success: true,
        message: 'Menu access updated successfully'
      };
    } catch (error) {
      console.error('RoleService: Error in updateRoleMenuAccess:', error);
      return { success: false, message: 'Failed to update menu access' };
    }
  }
};

// Survey Service
export const SurveyService = {
  async getSurveys(): Promise<ApiResponse<Survey[]>> {
    try {
      console.log('SurveyService: Fetching surveys');
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo mode - no surveys available' };
      }

      const { data, error } = await supabase
        .from('surveys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SurveyService: Error fetching surveys:', error);
        return { success: false, message: `Failed to fetch surveys: ${error.message}`, data: [] };
      }

      const surveys: Survey[] = data.map(survey => ({
        id: survey.id,
        title: survey.title,
        description: survey.description,
        targetDate: new Date(survey.target_date),
        duration: survey.duration,
        totalQuestions: survey.total_questions,
        passingScore: survey.passing_score,
        maxAttempts: survey.max_attempts,
        isActive: survey.is_active,
        sections: [],
        createdAt: new Date(survey.created_at),
        updatedAt: new Date(survey.updated_at),
        createdBy: survey.created_by,
        assignedZones: survey.assigned_zones,
        assignedRegions: survey.assigned_regions
      }));

      return {
        success: true,
        data: surveys,
        message: 'Surveys fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in getSurveys:', error);
      return { success: false, message: 'Failed to fetch surveys', data: [] };
    }
  },

  async createSurvey(surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      console.log('SurveyService: Creating survey:', surveyData.title);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          target_date: surveyData.targetDate.toISOString().split('T')[0],
          duration: surveyData.duration,
          total_questions: surveyData.totalQuestions,
          passing_score: surveyData.passingScore,
          max_attempts: surveyData.maxAttempts,
          is_active: true,
          created_by: surveyData.createdBy
        })
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Error creating survey:', error);
        return { success: false, message: `Failed to create survey: ${error.message}` };
      }

      const survey: Survey = {
        id: data.id,
        title: data.title,
        description: data.description,
        targetDate: new Date(data.target_date),
        duration: data.duration,
        totalQuestions: data.total_questions,
        passingScore: data.passing_score,
        maxAttempts: data.max_attempts,
        isActive: data.is_active,
        sections: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return {
        success: true,
        data: survey,
        message: 'Survey created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in createSurvey:', error);
      return { success: false, message: 'Failed to create survey' };
    }
  },

  async updateSurvey(surveyId: string, surveyData: any): Promise<ApiResponse<Survey>> {
    try {
      console.log('SurveyService: Updating survey:', surveyId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const updateData: any = {
        title: surveyData.title,
        description: surveyData.description,
        duration: surveyData.duration,
        total_questions: surveyData.totalQuestions,
        passing_score: surveyData.passingScore,
        max_attempts: surveyData.maxAttempts,
        updated_at: new Date().toISOString()
      };

      if (surveyData.targetDate) {
        updateData.target_date = surveyData.targetDate instanceof Date 
          ? surveyData.targetDate.toISOString().split('T')[0]
          : surveyData.targetDate;
      }

      if (surveyData.hasOwnProperty('isActive')) {
        updateData.is_active = surveyData.isActive;
      }

      const { data, error } = await supabase
        .from('surveys')
        .update(updateData)
        .eq('id', surveyId)
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Error updating survey:', error);
        return { success: false, message: `Failed to update survey: ${error.message}` };
      }

      const survey: Survey = {
        id: data.id,
        title: data.title,
        description: data.description,
        targetDate: new Date(data.target_date),
        duration: data.duration,
        totalQuestions: data.total_questions,
        passingScore: data.passing_score,
        maxAttempts: data.max_attempts,
        isActive: data.is_active,
        sections: [],
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by
      };

      return {
        success: true,
        data: survey,
        message: 'Survey updated successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in updateSurvey:', error);
      return { success: false, message: 'Failed to update survey' };
    }
  },

  async deleteSurvey(surveyId: string): Promise<ApiResponse<void>> {
    try {
      console.log('SurveyService: Deleting survey:', surveyId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId);

      if (error) {
        console.error('SurveyService: Error deleting survey:', error);
        return { success: false, message: `Failed to delete survey: ${error.message}` };
      }

      return {
        success: true,
        message: 'Survey deleted successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in deleteSurvey:', error);
      return { success: false, message: 'Failed to delete survey' };
    }
  },

  async getSurveySections(surveyId: string): Promise<ApiResponse<Section[]>> {
    try {
      console.log('SurveyService: Fetching sections for survey:', surveyId);
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo mode - no sections available' };
      }

      const { data, error } = await supabase
        .from('survey_sections')
        .select('*')
        .eq('survey_id', surveyId)
        .order('section_order', { ascending: true });

      if (error) {
        console.error('SurveyService: Error fetching sections:', error);
        return { success: false, message: `Failed to fetch sections: ${error.message}`, data: [] };
      }

      const sections: Section[] = data.map(section => ({
        id: section.id,
        surveyId: section.survey_id,
        title: section.title,
        description: section.description,
        questionsCount: section.questions_count,
        order: section.section_order,
        questions: []
      }));

      return {
        success: true,
        data: sections,
        message: 'Sections fetched successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in getSurveySections:', error);
      return { success: false, message: 'Failed to fetch sections', data: [] };
    }
  },

  async createSection(surveyId: string, sectionData: any): Promise<ApiResponse<Section>> {
    try {
      console.log('SurveyService: Creating section for survey:', surveyId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('survey_sections')
        .insert({
          survey_id: surveyId,
          title: sectionData.title,
          description: sectionData.description,
          questions_count: sectionData.questionsCount,
          section_order: sectionData.order
        })
        .select()
        .single();

      if (error) {
        console.error('SurveyService: Error creating section:', error);
        return { success: false, message: `Failed to create section: ${error.message}` };
      }

      const section: Section = {
        id: data.id,
        surveyId: data.survey_id,
        title: data.title,
        description: data.description,
        questionsCount: data.questions_count,
        order: data.section_order,
        questions: []
      };

      return {
        success: true,
        data: section,
        message: 'Section created successfully'
      };
    } catch (error) {
      console.error('SurveyService: Error in createSection:', error);
      return { success: false, message: 'Failed to create section' };
    }
  }
};

// Question Service
export const QuestionService = {
  async getQuestions(surveyId: string, sectionId: string): Promise<ApiResponse<Question[]>> {
    try {
      console.log('QuestionService: Fetching questions for section:', sectionId);
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo mode - no questions available' };
      }

      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_options(*)
        `)
        .eq('section_id', sectionId)
        .order('question_order', { ascending: true });

      if (error) {
        console.error('QuestionService: Error fetching questions:', error);
        return { success: false, message: `Failed to fetch questions: ${error.message}`, data: [] };
      }

      const questions: Question[] = data.map(question => ({
        id: question.id,
        sectionId: question.section_id,
        text: question.text,
        type: question.question_type,
        complexity: question.complexity,
        points: question.points,
        explanation: question.explanation,
        order: question.question_order,
        options: question.question_options
          .sort((a: any, b: any) => a.option_order - b.option_order)
          .map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
        correctAnswers: question.question_options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id),
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at)
      }));

      return {
        success: true,
        data: questions,
        message: 'Questions fetched successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error in getQuestions:', error);
      return { success: false, message: 'Failed to fetch questions', data: [] };
    }
  },

  async createQuestion(questionData: any): Promise<ApiResponse<Question>> {
    try {
      console.log('QuestionService: Creating question for section:', questionData.sectionId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      // Insert question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          section_id: questionData.sectionId,
          text: questionData.text,
          question_type: questionData.type,
          complexity: questionData.complexity,
          points: questionData.points,
          explanation: questionData.explanation,
          question_order: questionData.order
        })
        .select()
        .single();

      if (questionError) {
        console.error('QuestionService: Error creating question:', questionError);
        return { success: false, message: `Failed to create question: ${questionError.message}` };
      }

      // Insert options
      const optionsToInsert = questionData.options.map((option: any, index: number) => ({
        question_id: question.id,
        text: option.text,
        is_correct: option.isCorrect,
        option_order: index + 1
      }));

      const { data: options, error: optionsError } = await supabase
        .from('question_options')
        .insert(optionsToInsert)
        .select();

      if (optionsError) {
        console.error('QuestionService: Error creating options:', optionsError);
        // Try to clean up the question if options failed
        await supabase.from('questions').delete().eq('id', question.id);
        return { success: false, message: `Failed to create question options: ${optionsError.message}` };
      }

      const createdQuestion: Question = {
        id: question.id,
        sectionId: question.section_id,
        text: question.text,
        type: question.question_type,
        complexity: question.complexity,
        points: question.points,
        explanation: question.explanation,
        order: question.question_order,
        options: options
          .sort((a: any, b: any) => a.option_order - b.option_order)
          .map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            isCorrect: opt.is_correct
          })),
        correctAnswers: options
          .filter((opt: any) => opt.is_correct)
          .map((opt: any) => opt.id),
        createdAt: new Date(question.created_at),
        updatedAt: new Date(question.updated_at)
      };

      return {
        success: true,
        data: createdQuestion,
        message: 'Question created successfully'
      };
    } catch (error) {
      console.error('QuestionService: Error in createQuestion:', error);
      return { success: false, message: `Failed to create question: ${error instanceof Error ? error.message : 'Unknown error'}` };
    }
  },

  async uploadQuestions(csvContent: string): Promise<ApiResponse<FileUploadResult>> {
    try {
      console.log('QuestionService: Processing CSV upload');
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const lines = csvContent.split('\n').filter(line => line.trim());
      if (lines.length < 2) {
        return { success: false, message: 'CSV file appears to be empty or invalid' };
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log('CSV headers:', headers);

      let questionsAdded = 0;
      let questionsSkipped = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          
          if (values.length < headers.length) {
            errors.push(`Line ${i + 1}: Insufficient columns`);
            questionsSkipped++;
            continue;
          }

          // Parse CSV data
          const questionText = values[2];
          const questionType = values[3];
          const complexity = values[4];
          const points = parseInt(values[5]) || 1;
          const explanation = values[6];
          const questionOrder = parseInt(values[7]) || i;
          const optionA = values[8];
          const optionB = values[9];
          const optionC = values[10];
          const optionD = values[11];
          const correctOptions = values[12];

          if (!questionText || !questionType) {
            errors.push(`Line ${i + 1}: Missing question text or type`);
            questionsSkipped++;
            continue;
          }

          // For demo purposes, use a default section ID
          const sectionId = '550e8400-e29b-41d4-a716-446655440030';

          // Create question
          const { data: question, error: questionError } = await supabase
            .from('questions')
            .insert({
              section_id: sectionId,
              text: questionText,
              question_type: questionType,
              complexity: complexity || 'medium',
              points: points,
              explanation: explanation,
              question_order: questionOrder
            })
            .select()
            .single();

          if (questionError) {
            errors.push(`Line ${i + 1}: ${questionError.message}`);
            questionsSkipped++;
            continue;
          }

          // Create options
          const options = [
            { text: optionA, isCorrect: correctOptions.includes('A') },
            { text: optionB, isCorrect: correctOptions.includes('B') },
            { text: optionC, isCorrect: correctOptions.includes('C') },
            { text: optionD, isCorrect: correctOptions.includes('D') }
          ].filter(opt => opt.text);

          const optionsToInsert = options.map((option, index) => ({
            question_id: question.id,
            text: option.text,
            is_correct: option.isCorrect,
            option_order: index + 1
          }));

          const { error: optionsError } = await supabase
            .from('question_options')
            .insert(optionsToInsert);

          if (optionsError) {
            errors.push(`Line ${i + 1}: Failed to create options - ${optionsError.message}`);
            // Clean up question
            await supabase.from('questions').delete().eq('id', question.id);
            questionsSkipped++;
            continue;
          }

          questionsAdded++;
        } catch (error) {
          errors.push(`Line ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          questionsSkipped++;
        }
      }

      return {
        success: true,
        data: {
          fileName: 'upload.csv',
          questionsAdded,
          questionsSkipped,
          errors,
          success: questionsAdded > 0
        },
        message: `Upload completed: ${questionsAdded} questions added, ${questionsSkipped} skipped`
      };
    } catch (error) {
      console.error('QuestionService: Error in uploadQuestions:', error);
      return { success: false, message: 'Failed to process CSV upload' };
    }
  }
};

// Test Service
export const TestService = {
  async getSession(sessionId: string): Promise<ApiResponse<TestSession>> {
    try {
      console.log('TestService: Getting session:', sessionId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { data, error } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('TestService: Error fetching session:', error);
        return { success: false, message: `Session not found: ${error.message}` };
      }

      const session: TestSession = {
        id: data.id,
        userId: data.user_id,
        surveyId: data.survey_id,
        startTime: new Date(data.start_time),
        endTime: data.end_time ? new Date(data.end_time) : undefined,
        timeRemaining: data.time_remaining,
        currentQuestionIndex: data.current_question_index,
        answers: [],
        status: data.session_status,
        attemptNumber: data.attempt_number,
        score: data.score,
        isPassed: data.is_passed,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined
      };

      return {
        success: true,
        data: session,
        message: 'Session fetched successfully'
      };
    } catch (error) {
      console.error('TestService: Error in getSession:', error);
      return { success: false, message: 'Failed to fetch session' };
    }
  }
};

// Dashboard Service
export const DashboardService = {
  async getDashboardData(): Promise<ApiResponse<Dashboard>> {
    try {
      console.log('DashboardService: Fetching dashboard data');
      
      if (!supabase) {
        return {
          success: true,
          data: {
            totalUsers: 5,
            totalSurveys: 1,
            totalAttempts: 0,
            averageScore: 0,
            passRate: 0,
            recentActivity: [],
            performanceByRole: [],
            performanceBySurvey: [],
            monthlyTrends: []
          },
          message: 'Demo dashboard data'
        };
      }

      // Get basic counts
      const [usersResult, surveysResult, attemptsResult] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('surveys').select('id', { count: 'exact', head: true }),
        supabase.from('test_results').select('id', { count: 'exact', head: true })
      ]);

      const totalUsers = usersResult.count || 0;
      const totalSurveys = surveysResult.count || 0;
      const totalAttempts = attemptsResult.count || 0;

      // Get pass rate and average score
      const { data: results } = await supabase
        .from('test_results')
        .select('score, is_passed');

      const passedCount = results?.filter(r => r.is_passed).length || 0;
      const passRate = totalAttempts > 0 ? (passedCount / totalAttempts) * 100 : 0;
      const averageScore = results?.length ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;

      return {
        success: true,
        data: {
          totalUsers,
          totalSurveys,
          totalAttempts,
          averageScore,
          passRate,
          recentActivity: [],
          performanceByRole: [],
          performanceBySurvey: [],
          monthlyTrends: []
        },
        message: 'Dashboard data fetched successfully'
      };
    } catch (error) {
      console.error('DashboardService: Error in getDashboardData:', error);
      return { success: false, message: 'Failed to fetch dashboard data' };
    }
  }
};

// Certificate Service
export const CertificateService = {
  async getCertificates(): Promise<ApiResponse<Certificate[]>> {
    try {
      console.log('CertificateService: Fetching certificates');
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo mode - no certificates available' };
      }

      const { data, error } = await supabase
        .from('certificates')
        .select(`
          *,
          user:users(*),
          survey:surveys(*)
        `)
        .order('issued_at', { ascending: false });

      if (error) {
        console.error('CertificateService: Error fetching certificates:', error);
        return { success: false, message: `Failed to fetch certificates: ${error.message}`, data: [] };
      }

      const certificates: Certificate[] = data.map(cert => ({
        id: cert.id,
        userId: cert.user_id,
        user: {
          id: cert.user.id,
          name: cert.user.name,
          email: cert.user.email,
          role: { name: 'User' }
        } as any,
        surveyId: cert.survey_id,
        survey: {
          id: cert.survey.id,
          title: cert.survey.title
        } as any,
        resultId: cert.result_id,
        certificateNumber: cert.certificate_number,
        issuedAt: new Date(cert.issued_at),
        validUntil: cert.valid_until ? new Date(cert.valid_until) : undefined,
        downloadCount: cert.download_count,
        status: cert.certificate_status
      }));

      return {
        success: true,
        data: certificates,
        message: 'Certificates fetched successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in getCertificates:', error);
      return { success: false, message: 'Failed to fetch certificates', data: [] };
    }
  },

  async downloadCertificate(certificateId: string): Promise<ApiResponse<Blob>> {
    try {
      console.log('CertificateService: Downloading certificate:', certificateId);
      
      // Generate a simple PDF-like content
      const pdfContent = `Certificate ID: ${certificateId}\nGenerated on: ${new Date().toISOString()}`;
      const blob = new Blob([pdfContent], { type: 'application/pdf' });

      return {
        success: true,
        data: blob,
        message: 'Certificate downloaded successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in downloadCertificate:', error);
      return { success: false, message: 'Failed to download certificate' };
    }
  },

  async revokeCertificate(certificateId: string): Promise<ApiResponse<void>> {
    try {
      console.log('CertificateService: Revoking certificate:', certificateId);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('certificates')
        .update({ certificate_status: 'revoked' })
        .eq('id', certificateId);

      if (error) {
        console.error('CertificateService: Error revoking certificate:', error);
        return { success: false, message: `Failed to revoke certificate: ${error.message}` };
      }

      return {
        success: true,
        message: 'Certificate revoked successfully'
      };
    } catch (error) {
      console.error('CertificateService: Error in revokeCertificate:', error);
      return { success: false, message: 'Failed to revoke certificate' };
    }
  }
};

// Settings Service
export const SettingsService = {
  async getSettings(): Promise<ApiResponse<SystemSettings[]>> {
    try {
      console.log('SettingsService: Fetching settings');
      
      if (!supabase) {
        return { success: true, data: [], message: 'Demo mode - no settings available' };
      }

      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('category', { ascending: true });

      if (error) {
        console.error('SettingsService: Error fetching settings:', error);
        return { success: false, message: `Failed to fetch settings: ${error.message}`, data: [] };
      }

      const settings: SystemSettings[] = data.map(setting => ({
        id: setting.id,
        category: setting.category,
        key: setting.setting_key,
        value: setting.setting_value,
        description: setting.description,
        type: setting.setting_type,
        isEditable: setting.is_editable,
        options: setting.options,
        updatedAt: new Date(setting.updated_at),
        updatedBy: setting.updated_by || 'system'
      }));

      return {
        success: true,
        data: settings,
        message: 'Settings fetched successfully'
      };
    } catch (error) {
      console.error('SettingsService: Error in getSettings:', error);
      return { success: false, message: 'Failed to fetch settings', data: [] };
    }
  },

  async updateSetting(id: string, value: string, updatedBy?: string): Promise<ApiResponse<void>> {
    try {
      console.log('SettingsService: Updating setting:', id);
      
      if (!supabase) {
        return { success: false, message: 'Database not configured' };
      }

      const { error } = await supabase
        .from('system_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        })
        .eq('id', id);

      if (error) {
        console.error('SettingsService: Error updating setting:', error);
        return { success: false, message: `Failed to update setting: ${error.message}` };
      }

      return {
        success: true,
        message: 'Setting updated successfully'
      };
    } catch (error) {
      console.error('SettingsService: Error in updateSetting:', error);
      return { success: false, message: 'Failed to update setting' };
    }
  }
};