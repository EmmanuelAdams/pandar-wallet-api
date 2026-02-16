export interface CreateUserDto {
  email: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  balance: number;
  token: string;
  createdAt: string;
}
