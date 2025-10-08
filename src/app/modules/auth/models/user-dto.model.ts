export interface RoleDto {
  id: number;
  name: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  username: string;
  avatarUrl: string;
  roles: RoleDto[];
}
