// ---- DTOs (lo que viene del backend) ----
export interface AuthMeResponseDto {
  id: string;
  email: string;
  name: string;
  roles: Array<{ id: string; name: string }>;
  permissions: string[];
}

export interface AuthLoginDto {
  email: string;
  password: string;
}

export interface AuthForgotPasswordDto {
  email: string;
}

// ---- ViewModels (lo que usa la UI) ----
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  initials: string;       // campo derivado: "John Doe" → "JD"
  roles: string[];        // solo los nombres de roles, no objetos
  permissions: string[];
}
