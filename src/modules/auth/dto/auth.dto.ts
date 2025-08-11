export interface ApiResponse<T = any> {
  message: string;
  statusCode: number;
  data: T;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginResult {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuthResponseDto extends ApiResponse {
  data: LoginResult;
}

export interface ProfileResponseDto extends ApiResponse {
  data: UserProfile;
}

export interface LogoutResponseDto extends ApiResponse {
  data: null;
}
